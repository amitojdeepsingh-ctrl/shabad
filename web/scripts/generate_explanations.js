/**
 * Batch pre-generate explanations for all verses via Ollama.
 * Resumable — only processes verses where explanation IS NULL.
 * Run: node scripts/generate_explanations.js
 *
 * Set concurrency via FIRST_ARG: node scripts/generate_explanations.js 5
 */

const Database = require('better-sqlite3')
const path = require('path')

const CONCURRENCY = parseInt(process.argv[2], 10) || 3
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const DB_PATH = path.join(__dirname, '..', 'data', 'gurugranth.db')

const SOURCE_LABELS = { ggs: 'Sri Guru Granth Sahib', D: 'Sri Dasam Granth', B: 'Vaaran Bhai Gurdas' }

const SYSTEM_PROMPT = `You are Shabad, a warm and wise spiritual teacher. You make the Guru Granth Sahib's wisdom accessible to everyone from age 6 to 70.

Rules:
- Explain in plain, simple language. A child should understand.
- Never alter the original Gurmukhi text.
- Base everything strictly on the provided translation.
- Connect the teaching to real-life struggles.
- Do not proselytize. Welcome all faiths and no faith.
- Be warm, humble, and gentle like a beloved elder.`

function buildPrompt(verse) {
  const label = SOURCE_LABELS[verse.source] || 'scriptures'
  return `Explain this verse from ${label}:

GURBANI: ${verse.gurmukhi}
TRANSLATION: ${verse.translation}
METADATA: ${verse.raag ? `Raag ${verse.raag}, ` : ''}${verse.author ? `${verse.author}, ` : ''}Page ${verse.ang}

Respond in exactly this format:

### The Wisdom
(one simple sentence a child can repeat)

### In Simple Words
(explain like talking to a 10-year-old, 2-3 sentences)

### Where It Fits
(map to 1-2 real-life struggles)

### How To Live It
(a concrete doable practice for today)

### A Question For You
(one gentle open-ended question)`
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

async function processVerse(db, verse) {
  try {
    const explanation = await ollamaChat(buildPrompt(verse))
    if (explanation) {
      db.prepare('UPDATE verses SET explanation = ? WHERE id = ?').run(explanation, verse.id)
      return true
    }
  } catch (err) {
    // retryable
  }
  return false
}

async function main() {
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')

  const total = db.prepare('SELECT COUNT(*) as c FROM verses WHERE explanation IS NULL').get()
  console.log(`\n  Verses needing explanation: ${total.c}`)
  if (total.c === 0) { console.log('  All done!'); db.close(); return }

  let done = 0
  let failed = 0

  while (true) {
    const verses = db.prepare('SELECT * FROM verses WHERE explanation IS NULL ORDER BY source, ang, line_number LIMIT ?').all(CONCURRENCY * 5)
    if (verses.length === 0) break

    for (let i = 0; i < verses.length; i += CONCURRENCY) {
      const batch = verses.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(batch.map(v => processVerse(db, v)))
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) done++
        else failed++
      }
      const pct = total.c > 0 ? ((done / total.c) * 100).toFixed(1) : '100'
      process.stdout.write(`\r  Done: ${done}/${total.c} (${pct}%) | Failed: ${failed}    `)
    }
  }

  console.log(`\n\n  Complete! Generated: ${done}, Failed: ${failed}`)
  db.close()
}

main().catch(err => { console.error(err); process.exit(1) })
