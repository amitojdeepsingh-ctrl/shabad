import path from 'path'
import fs from 'fs'
import type { Verse } from './types'

let SQL: any = null
let db: any = null
let initPromise: Promise<void> | null = null

const DB_PATH = path.join(process.cwd(), 'data', 'gurugranth.db')

async function getDb(): Promise<any | null> {
  if (db) return db
  if (initPromise) { await initPromise; return db }
  initPromise = init()
  await initPromise
  return db
}

async function init() {
  if (!fs.existsSync(DB_PATH)) return
  try {
    const initSqlJs = (await import('sql.js')).default
    SQL = await initSqlJs()
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } catch { }
}

function queryAll(db: any, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function queryOne(db: any, sql: string, params: any[] = []): any | null {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

export async function isDatabaseReady(): Promise<boolean> {
  const d = await getDb()
  return d !== null
}

export async function getVersesByAng(ang: number, source = 'ggs'): Promise<Verse[]> {
  const d = await getDb()
  if (!d) return []
  return queryAll(d, 'SELECT * FROM verses WHERE ang = ? AND source = ? ORDER BY line_number', [ang, source])
}

export async function searchVerses(query: string, source: string | null = 'ggs', limit = 20): Promise<Verse[]> {
  const d = await getDb()
  if (!d) return []
  const pattern = `%${query}%`
  if (source) {
    return queryAll(d, 'SELECT * FROM verses WHERE source = ? AND (translation LIKE ? OR gurmukhi LIKE ?) LIMIT ?', [source, pattern, pattern, limit])
  }
  return queryAll(d, 'SELECT * FROM verses WHERE translation LIKE ? OR gurmukhi LIKE ? LIMIT ?', [pattern, pattern, limit])
}

export async function getAngRange(source = 'ggs'): Promise<{ min: number; max: number }> {
  const d = await getDb()
  if (!d) return { min: 0, max: 0 }
  const row = queryOne(d, 'SELECT MIN(ang) as min, MAX(ang) as max FROM verses WHERE source = ?', [source])
  return row || { min: 0, max: 0 }
}

export async function getPageExplanation(source: string, ang: number): Promise<string | null> {
  const d = await getDb()
  if (!d) return null
  const row = queryOne(d, 'SELECT explanation FROM page_explanations WHERE source = ? AND ang = ?', [source, ang])
  return row?.explanation || null
}

export async function getTotalVerses(source: string | null = null): Promise<number> {
  const d = await getDb()
  if (!d) return 0
  if (source) {
    const row = queryOne(d, 'SELECT COUNT(*) as count FROM verses WHERE source = ?', [source])
    return row?.count || 0
  }
  const row = queryOne(d, 'SELECT COUNT(*) as count FROM verses')
  return row?.count || 0
}
