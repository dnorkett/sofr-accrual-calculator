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
function validate({ principal, spreadBps, startDate, endDate }) {
  const errors = {};

  const p = Number(principal);
  const s = Number(spreadBps);

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
  const lines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(",")
  );
  return [headerLine, ...lines].join("\n");
}

function downloadTextFile(
  filename,
  content,
  mimeType = "text/plain;charset=utf-8"
) {
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
  const [method, setMethod] = useState("TERM_SOFR_ACT360");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Track what the user has interacted with, so we don't spam errors immediately.
  const [touched, setTouched] = useState({});

  function touch(name) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  const currentErrors = useMemo(
    () => validate({ principal, spreadBps, startDate, endDate }),
    [principal, spreadBps, startDate, endDate]
  );

  const isValid = Object.keys(currentErrors).length === 0;

  // Show error if field touched, or if user attempted to submit once.
  function showError(name) {
    return (touched[name] || touched._submitted) && currentErrors[name];
  }

  const canSubmit = useMemo(() => {
    return principal && spreadBps && startDate && endDate && method;
  }, [principal, spreadBps, startDate, endDate, method]);

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
          method,
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

    // Optional: include some summary columns on every row (easy for Excel pivoting)
    const rows = result.daily.map((r) => ({
      startDate: result.startDate,
      endDate: result.endDate,
      principal: result.principal,
      spreadBps: result.spreadBps,
      method: result.method,

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
      "method",
      "date",
      "baseRate",
      "spread",
      "allInRate",
      "dayCountFraction",
      "dailyInterest",
      "accruedToDate",
    ];

    const csv = toCsv(rows, headers);

    // Nice filename for a portfolio app
    const safeStart = (result.startDate || "start").replaceAll(":", "-");
    const safeEnd = (result.endDate || "end").replaceAll(":", "-");
    const filename = `sofr-accrual_${safeStart}_to_${safeEnd}.csv`;

    downloadTextFile(filename, csv, "text/csv;charset=utf-8");
  }

  return (
    <div className="container">
      <div className="header">
        <h1>SOFR Interest Accrual Calculator</h1>
        <p>React UI → Express API → SQLite</p>
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

          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Accrual Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="TERM_SOFR_ACT360">TERM SOFR (ACT/360)</option>
              </select>
            </div>

            <div className="note" style={{ alignSelf: "end" }}>
              The Secured Overnight Financing Rate (SOFR) is published daily by the Federal Reserve
              Bank of New York on its website, usually around 8 a.m. ET on U.S. business days.
            </div>
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
                <div className="label">Method</div>
                <div className="value">{result.method}</div>
              </div>
            </div>

            <div className="actions" style={{ marginTop: 12 }}>
              <button onClick={exportCsv}>Export CSV</button>
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
          </div>
        )}
      </div>
    </div>
  );
}
