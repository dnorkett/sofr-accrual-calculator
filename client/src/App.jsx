import { useMemo, useState } from "react";

const API_BASE = "http://localhost:3001";

function fmtMoney(x) {
  if (x == null || Number.isNaN(Number(x))) return "-";
  return Number(x).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function fmtPctDecimalToPct(x) {
  // decimal (0.0525) -> 5.25%
  return `${(Number(x) * 100).toFixed(3)}%`;
}

/**
 * Inline validation (frontend UX)
 * - Fast feedback near fields
 * - Still keep server-side validation later
 */
function validate({ principal, spreadBps, startDate, endDate, lookbackDays }) {
  const errors = {};

  const p = Number(principal);
  const s = Number(spreadBps);
  const l = Number(lookbackDays);

  if (!principal || Number.isNaN(p) || p <= 0) {
    errors.principal = "Enter a positive principal amount.";
  }

  if (spreadBps === "" || Number.isNaN(s) || s < 0) {
    errors.spreadBps = "Enter a spread ≥ 0 (in basis points).";
  }

  if (!startDate) {
    errors.startDate = "Choose a start date.";
  }

  if (!endDate) {
    errors.endDate = "Choose an end date.";
  }

  if (startDate && endDate && endDate < startDate) {
    errors.endDate = "End date must be on or after start date.";
  }

  if (
    lookbackDays === "" ||
    Number.isNaN(l) ||
    !Number.isInteger(l) ||
    l < 0 ||
    l > 99
  ) {
    errors.lookbackDays = "Enter an integer from 0 to 99.";
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <div className="error">{message}</div>;
}

function csvEscape(value) {
  if (value == null) return "";
  const s = String(value);
  // Escape quotes by doubling them; wrap in quotes if it contains special chars
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows, headers) {
  const headerLine = headers.map(csvEscape).join(",");
  const lines = rows.map((row) => headers.map((h) => csvEscape(row[h])).join(","));
  return [headerLine, ...lines].join("\n");
}

function downloadTextFile(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export default function App() {
  const [principal, setPrincipal] = useState("1000000");
  const [spreadBps, setSpreadBps] = useState("250");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-01-10");

  // Rate/index settings
  const [rateIndex, setRateIndex] = useState("SOFR_DAILY_SIMPLE");
  const [dayCount, setDayCount] = useState("ACT_ACT");

  // New: lookback days (0–99), default 5
  const [lookbackDays, setLookbackDays] = useState("5");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  // Track what the user has interacted with, so we don't spam errors immediately.
  const [touched, setTouched] = useState({});

  function touch(name) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  const currentErrors = useMemo(
    () =>
      validate({
        principal,
        spreadBps,
        startDate,
        endDate,
        lookbackDays,
      }),
    [principal, spreadBps, startDate, endDate, lookbackDays]
  );

  const isValid = Object.keys(currentErrors).length === 0;

  // Show error if field touched, or if user attempted to submit once.
  function showError(name) {
    return (touched[name] || touched._submitted) && currentErrors[name];
  }

  const canSubmit = useMemo(() => {
    return (
      principal &&
      spreadBps &&
      startDate &&
      endDate &&
      rateIndex &&
      dayCount &&
      lookbackDays !== ""
    );
  }, [principal, spreadBps, startDate, endDate, rateIndex, dayCount, lookbackDays]);

  async function importLatestRates() {
    if (importing) return;

    setImporting(true);
    setImportMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/rates/import-latest`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Import failed");
      }

      const note = data.note ? ` (${data.note})` : "";
      setImportMsg(
        `Imported ${data.upsertedCount} rates (requested ${data.lookbackDaysRequested ?? data.lookbackDays ?? data.lookbackDaysRequested ?? data.lookbackDays} days).${note}`
      );
    } catch (e) {
      setImportMsg(e.message);
    } finally {
      setImporting(false);
    }
  }

  async function calculate() {
    if (loading) return;

    // Mark a submit attempt so errors show even if fields weren't blurred.
    setTouched((t) => ({ ...t, _submitted: true }));

    // Prevent API call if invalid; inline errors will show.
    if (!isValid) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/calc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: Number(principal),
          spreadBps: Number(spreadBps),
          startDate,
          endDate,
          rateIndex,
          dayCount,
          lookbackDays: Number(lookbackDays),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || "Request failed";
        const hint = data?.hint ? ` ${data.hint}` : "";
        throw new Error(msg + hint);
      }

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!result) return;

    const rows = result.daily.map((r) => ({
      startDate: result.startDate,
      endDate: result.endDate,
      principal: result.principal,
      spreadBps: result.spreadBps,
      rateIndex: result.rateIndex,
      dayCount: result.dayCount,
      lookbackDays: result.lookbackDays,

      date: r.date,
      baseRate: r.baseRate,
      spread: r.spread,
      allInRate: r.allInRate,
      dayCountFraction: r.dayCountFraction,
      dailyInterest: r.interest,
      accruedToDate: r.accruedToDate,
    }));

    const headers = [
      "startDate",
      "endDate",
      "principal",
      "spreadBps",
      "rateIndex",
      "dayCount",
      "lookbackDays",
      "date",
      "baseRate",
      "spread",
      "allInRate",
      "dayCountFraction",
      "dailyInterest",
      "accruedToDate",
    ];

    const csv = toCsv(rows, headers);

    const safeStart = (result.startDate || "start").replaceAll(":", "-");
    const safeEnd = (result.endDate || "end").replaceAll(":", "-");
    const filename = `sofr-accrual_${safeStart}_to_${safeEnd}.csv`;

    downloadTextFile(filename, csv, "text/csv;charset=utf-8");
  }

  return (
    <div className="container">
      <div className="header">
        <h1>SOFR Interest Accrual Calculator</h1>
        <p>A lightweight SOFR accrual engine for real-world loan scenarios.</p>
      </div>

      <div className="grid">
        <div className="card">
          <div className="row">
            <div>
              <label>Principal (USD)</label>
              <input
                name="principal"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                onBlur={() => touch("principal")}
                inputMode="decimal"
              />
              <FieldError message={showError("principal")} />
            </div>

            <div>
              <label>Spread (bps)</label>
              <input
                name="spreadBps"
                value={spreadBps}
                onChange={(e) => setSpreadBps(e.target.value)}
                onBlur={() => touch("spreadBps")}
                inputMode="numeric"
              />
              <FieldError message={showError("spreadBps")} />
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => touch("startDate")}
              />
              <FieldError message={showError("startDate")} />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={() => touch("endDate")}
              />
              <FieldError message={showError("endDate")} />
            </div>
          </div>

          {/* Rate, day-count, and lookback */}
          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Reference rate</label>
              <select
                value={rateIndex}
                onChange={(e) => setRateIndex(e.target.value)}
              >
                <option value="SOFR_DAILY_SIMPLE">
                  SOFR – Daily Simple (overnight)
                </option>
              </select>
            </div>

            <div>
              <label>Day count convention</label>
              <select
                value={dayCount}
                onChange={(e) => setDayCount(e.target.value)}
              >
                <option value="ACT_ACT">Actual / Actual</option>
                <option value="ACT_360">Actual / 360</option>
              </select>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Lookback days</label>
              <input
                name="lookbackDays"
                type="number"
                min={0}
                max={99}
                step={1}
                value={lookbackDays}
                onChange={(e) => setLookbackDays(e.target.value)}
                onBlur={() => touch("lookbackDays")}
                inputMode="numeric"
              />
              <FieldError message={showError("lookbackDays")} />
            </div>

            <div className="note" style={{ alignSelf: "flex-end" }}>
              For a lookback of N days, each day’s rate is taken from N days
              earlier (with the same weekend/holiday carry-forward rules).
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="note">
              The Secured Overnight Financing Rate (SOFR) is published daily by
              the Federal Reserve Bank of New York on its website, usually
              around 8 a.m. ET on U.S. business days.
            </div>
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <button onClick={importLatestRates} disabled={importing}>
              {importing ? "Importing…" : "Import latest rates"}
            </button>
            {importMsg && (
              <div className="note" style={{ marginTop: 8 }}>
                {importMsg}
              </div>
            )}
          </div>

          <div className="actions">
            {/* Intentionally NOT disabling on invalid:
                user can click and see inline errors, but API call is blocked in calculate() */}
            <button onClick={calculate} disabled={!canSubmit || loading}>
              {loading ? "Calculating…" : "Calculate"}
            </button>
          </div>

          {error && <div className="error">{error}</div>}
        </div>

        {result && (
          <div className="card">
            <div className="kpis">
              <div className="kpi">
                <div className="label">Total Interest</div>
                <div className="value">{fmtMoney(result.totalInterest)}</div>
              </div>
              <div className="kpi">
                <div className="label">Total Amount (Principal + Interest)</div>
                <div className="value">{fmtMoney(result.totalAmount)}</div>
              </div>
              <div className="kpi">
                <div className="label">Reference rate</div>
                <div className="value">{result.rateIndex}</div>
              </div>
              <div className="kpi">
                <div className="label">Day count convention</div>
                <div className="value">{result.dayCount}</div>
              </div>
              <div className="kpi">
                <div className="label">Lookback days</div>
                <div className="value">{result.lookbackDays}</div>
              </div>
            </div>

            <details style={{ marginTop: 12 }}>
              <summary>Daily accrual breakdown ({result.daily.length} days)</summary>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Base Rate</th>
                    <th>All-in Rate</th>
                    <th>Daily Interest</th>
                    <th>Accrued To Date</th>
                  </tr>
                </thead>
                <tbody>
                  {result.daily.map((r) => (
                    <tr key={r.date}>
                      <td>{r.date}</td>
                      <td>{fmtPctDecimalToPct(r.baseRate)}</td>
                      <td>{fmtPctDecimalToPct(r.allInRate)}</td>
                      <td>{fmtMoney(r.interest)}</td>
                      <td>{fmtMoney(r.accruedToDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
            <div className="actions" style={{ marginTop: 12 }}>
              <button onClick={exportCsv}>Export CSV</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
