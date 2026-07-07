const Database = require('better-sqlite3')
const path = require('path')

const CONCURRENCY = parseInt(process.argv[2], 10) || 3
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const DB_PATH = path.join(__dirname, '..', 'data', 'gurugranth.db')

const SOURCE_LABELS = { ggs: 'Sri Guru Granth Sahib', D: 'Sri Dasam Granth', B: 'Vaaran Bhai Gurdas' }
const PAGE_LABELS = { ggs: 'Ang', D: 'Panna', B: 'Vaar' }

const SYSTEM_PROMPT = `You are Shabad, a warm and wise spiritual teacher who makes scripture wisdom accessible to everyone from age 6 to 70.

Rules:
- Explain in plain, simple language. A child should understand.
- Base everything strictly on the provided translations.
- Connect the teaching to real-life struggles.
- Do not proselytize. Welcome all faiths and no faith.
- Be warm, humble, and gentle like a beloved elder.`

function buildPrompt(source, page, verses) {
  const label = SOURCE_LABELS[source] || 'scriptures'
  const pageLabel = PAGE_LABELS[source] || 'Page'
  const sample = verses.slice(0, 8)
  const total = verses.length
  const body = sample.map((v, i) =>
    `${v.translation}`
  ).join('\n')
  const headnote = total > sample.length
    ? `\n\n(Note: This ${pageLabel.toLowerCase()} has ${total} verses. The first ${sample.length} are shown above.)`
    : ''
  return `Here are key verses from ${label}, ${pageLabel} ${page}:\n\n${body}${headnote}\n\nRespond in exactly this format (use ONLY these 3 sections, nothing else):\n\n### The Wisdom\n(one sentence capturing the essence of this ${pageLabel.toLowerCase()})\n\n### In Simple Words\n(explain like talking to a 10-year-old, 2-3 sentences)\n\n### How To Live It\n(a concrete practical action for the reader today, 1-2 sentences)`
}

async function ollamaChat(prompt) {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      stream: false,
      options: { num_predict: 512 },
    }),
  })
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  return data.message?.content || ''
}

async function processPage(db, source, page) {
  const verses = db.prepare('SELECT * FROM verses WHERE source = ? AND ang = ? ORDER BY line_number').all(source, page)
  if (!verses.length) return false
  try {
    const explanation = await ollamaChat(buildPrompt(source, page, verses))
    if (explanation) {
      db.prepare('INSERT OR REPLACE INTO page_explanations (source, ang, explanation) VALUES (?, ?, ?)').run(source, page, explanation)
      return true
    }
  } catch {}
  return false
}

async function main() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  const sources = [
    { source: 'ggs', label: 'GGS', pages: 1430 },
    { source: 'D', label: 'Dasam', pages: 1428 },
    { source: 'B', label: 'Vaaran', pages: 41 },
  ]

  let totalPages = 0
  let totalDone = 0
  let totalFailed = 0

  for (const { source, label, pages } of sources) {
    console.log(`\n  === ${label} (1-${pages}) ===`)
    const done = db.prepare('SELECT COUNT(*) as c FROM page_explanations WHERE source = ?').get(source)
    const remaining = pages - done.c
    console.log(`  Already done: ${done.c}, Remaining: ${remaining}`)
    totalPages += pages

    let pageDone = 0
    let pageFailed = 0

    for (let page = 1; page <= pages; page += CONCURRENCY) {
      const batch = []
      for (let p = page; p < page + CONCURRENCY && p <= pages; p++) {
        const existing = db.prepare('SELECT explanation FROM page_explanations WHERE source = ? AND ang = ?').get(source, p)
        if (!existing) batch.push(p)
      }
      if (batch.length === 0) {
        pageDone += Math.min(CONCURRENCY, pages - page + 1 - batch.length)
        continue
      }

      const results = await Promise.allSettled(batch.map(p => processPage(db, source, p)))
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) pageDone++
        else pageFailed++
      }

      const pct = pages > 0 ? (((done.c + pageDone) / pages) * 100).toFixed(1) : '100'
      process.stdout.write(`\r  ${label}: ${done.c + pageDone}/${pages} (${pct}%) | Failed: ${pageFailed}    `)
    }

    console.log(`\n  ${label} done — Generated: ${pageDone}, Failed: ${pageFailed}`)
    totalDone += pageDone
    totalFailed += pageFailed
  }

  console.log(`\n\n  === TOTAL ===\n  Pages: ${totalPages}, Generated: ${totalDone}, Failed: ${totalFailed}`)
  db.close()
}

main().catch(err => { console.error(err); process.exit(1) })
