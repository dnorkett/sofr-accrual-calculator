const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function openDb(dbPath) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return new Database(dbPath);
}

module.exports = { openDb };
