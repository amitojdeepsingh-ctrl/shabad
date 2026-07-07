export type ScriptureSource = 'ggs' | 'D' | 'B'

export interface Verse {
  id: number
  ang: number
  line_number: number
  gurmukhi: string
  transliteration: string
  translation: string
  raag: string
  author: string
  source: string
}

export const SOURCES: { key: ScriptureSource; label: string; pages: number; pageLabel: string }[] = [
  { key: 'ggs', label: 'Sri Guru Granth Sahib', pages: 1430, pageLabel: 'Ang' },
  { key: 'D', label: 'Sri Dasam Granth', pages: 1428, pageLabel: 'Panna' },
  { key: 'B', label: 'Vaaran Bhai Gurdas', pages: 41, pageLabel: 'Vaar' },
]
