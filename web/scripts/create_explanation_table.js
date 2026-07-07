const Database = require('better-sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, '..', 'data', 'gurugranth.db')
const db = new Database(dbPath)
db.exec(`
  CREATE TABLE IF NOT EXISTS page_explanations (
    source TEXT NOT NULL,
    ang INTEGER NOT NULL,
    explanation TEXT NOT NULL,
    PRIMARY KEY (source, ang)
  )
`)
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
console.log('Tables:', tables.map(t => t.name).join(', '))
db.close()
