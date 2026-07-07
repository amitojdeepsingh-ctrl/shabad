import path from 'path'
import fs from 'fs'
import type { Verse } from './types'

let db: any = null
let initPromise: Promise<any> | null = null

async function getDb(): Promise<any | null> {
  if (db) return db
  if (initPromise) return initPromise
  initPromise = init()
  return initPromise
}

async function init() {
  try {
    const initSqlJs = (await import('sql.js')).default
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        // 1. Filesystem: node_modules (local dev, Docker)
        const local = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
        if (fs.existsSync(local)) return local
        // 2. Filesystem: public/wasm (copied there for Vercel)
        const pub = path.join(process.cwd(), 'public', 'wasm', file)
        if (fs.existsSync(pub)) return pub
        // 3. CDN (Vercel serverless, most reliable)
        return `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${file}`
      },
    })

    let buffer: Buffer | null = null

    // Try filesystem paths (local dev, Docker, Vercel with traceIncludes)
    const candidates = [
      path.join(process.cwd(), 'public', 'data', 'gurugranth.db'),
      path.join(process.cwd(), 'data', 'gurugranth.db'),
      path.join(process.cwd(), '.next', 'public', 'data', 'gurugranth.db'),
    ]
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        buffer = fs.readFileSync(p)
        break
      }
    }

    // Fallback 1: fetch via HTTP from self (Vercel serves public/ as static assets)
    if (!buffer) {
      const urls: string[] = []
      if (process.env.VERCEL_URL) {
        urls.push(`https://${process.env.VERCEL_URL}/data/gurugranth.db`)
      }
      if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        urls.push(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/data/gurugranth.db`)
      }
      urls.push('/data/gurugranth.db') // relative URL fallback
      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (res.ok) {
            const ab = await res.arrayBuffer()
            buffer = Buffer.from(ab)
            break
          }
        } catch { continue }
      }
    }

    if (!buffer) {
      console.error('[shabad] DB not found at any path or URL')
      return null
    }

    db = new SQL.Database(buffer)
    return db
  } catch (e) {
    console.error('[shabad] DB init error:', e)
    return null
  }
}

function queryAll(d: any, sql: string, params: any[] = []): any[] {
  const stmt = d.prepare(sql)
  stmt.bind(params)
  const results: any[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

function queryOne(d: any, sql: string, params: any[] = []): any | null {
  const stmt = d.prepare(sql)
  stmt.bind(params)
  let result = null
  if (stmt.step()) {
    result = stmt.getAsObject()
  }
  stmt.free()
  return result
}

export async function getDbStatus(): Promise<{ ready: boolean; error?: string }> {
  const d = await getDb()
  return { ready: d !== null, error: d === null ? 'init returned null (see server logs)' : undefined }
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

export async function getPageExplanation(source: string, ang: number): Promise<string | null> {
  const d = await getDb()
  if (!d) return null
  const row = queryOne(d, 'SELECT explanation FROM page_explanations WHERE source = ? AND ang = ?', [source, ang])
  return row?.explanation || null
}

export async function getAngRange(source = 'ggs'): Promise<{ min: number; max: number }> {
  const d = await getDb()
  if (!d) return { min: 0, max: 0 }
  const row = queryOne(d, 'SELECT MIN(ang) as min, MAX(ang) as max FROM verses WHERE source = ?', [source])
  return row || { min: 0, max: 0 }
}
