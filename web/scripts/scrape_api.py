"""
Scrape Sri Dasam Granth (source D, 1428 pages) and Vaaran Bhai Gurdas (source B, 41 vaars)
from the GurbaniNow API: https://api.gurbaninow.com/v2/ang/{page}/{source}
"""
import sqlite3
import time
from pathlib import Path

import requests

API_BASE = "https://api.gurbaninow.com/v2/ang"
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "gurugranth.db"
DELAY = 0.3  # seconds between requests


def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    # Add source column if not present (migration)
    cols = [r[1] for r in conn.execute("PRAGMA table_info(verses)").fetchall()]
    if "source" not in cols:
        conn.execute("ALTER TABLE verses ADD COLUMN source TEXT DEFAULT 'ggs'")
        conn.execute("UPDATE verses SET source = 'ggs' WHERE source IS NULL")
    conn.commit()
    return conn


def extract_line(line_data: dict, page: int, line_idx: int, source: str, author: str):
    """Extract gurmukhi, transliteration, translation from an API line object."""
    line = line_data.get("line", {})
    gurmukhi = (line.get("gurmukhi") or {}).get("unicode", "")
    translit = (line.get("transliteration") or {}).get("english") or {}
    transliteration = translit.get("text", "") or translit.get("larivaar", "") or ""
    trans = (line.get("translation") or {}).get("english") or {}
    translation = trans.get("default", "") if isinstance(trans, dict) else (trans or "")
    line_type = line.get("type", 1)
    # Determine section from shabadid (group lines from same shabad together)
    # Store composition/section name from source metadata (e.g., "Jaap Sahib")
    return (page, line_idx, gurmukhi, transliteration, translation, "", author, "", source)


def scrape_source(source_key: str, source_name: str, total_pages: int, author: str, reverse: bool = False):
    """Scrape all pages of a given source from the API."""
    conn = init_db()
    cur = conn.cursor()

    # Check last page scraped
    meta_key = f"last_page_{source_key}"
    row = cur.execute("SELECT value FROM metadata WHERE key = ?", (meta_key,)).fetchone()
    start = int(row[0]) + 1 if row else 1

    page_range = range(total_pages, 0, -1) if reverse else range(start, total_pages + 1)

    total_verses = 0
    for page in page_range:
        url = f"{API_BASE}/{page}/{source_key}"
        try:
            resp = requests.get(url, timeout=30, headers={"User-Agent": "ShabadBot/1.0"})
            resp.raise_for_status()
            data = resp.json()
            page_lines = data.get("page", [])
            if not page_lines:
                print(f"  {source_name} page {page}: empty response")
                continue

            verses = []
            for idx, line_data in enumerate(page_lines):
                verses.append(extract_line(line_data, page, idx + 1, source_key, author))

            cur.execute("BEGIN TRANSACTION")
            for v in verses:
                cur.execute(
                    """INSERT OR IGNORE INTO verses
                       (ang, line_number, gurmukhi, transliteration, translation, raag, author, section, source)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    v
                )
            cur.execute(
                "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
                (meta_key, str(page))
            )
            conn.commit()
            total_verses += len(verses)
            print(f"  {source_name} page {page}/{total_pages}: {len(verses)} verses")

        except Exception as e:
            print(f"  {source_name} page {page}: ERROR - {e}")
            conn.rollback()

        time.sleep(DELAY)

    print(f"Done {source_name}: {total_verses} verses across {abs(page - start + 1)} pages")
    return total_verses


def main():
    import sys
    sources = []

    if len(sys.argv) > 1:
        if "dasam" in sys.argv:
            sources.append(("D", "Dasam Granth", 1428, "Guru Gobind Singh", False))
        if "vaaran" in sys.argv:
            sources.append(("B", "Vaaran Bhai Gurdas", 41, "Bhai Gurdas", False))
    else:
        sources = [
            ("D", "Dasam Granth", 1428, "Guru Gobind Singh", False),
            ("B", "Vaaran Bhai Gurdas", 41, "Bhai Gurdas", False),
        ]

    print("Starting API scrape...")
    total = 0
    for src in sources:
        print(f"\n=== {src[1]} ({src[2]} pages) ===")
        total += scrape_source(*src)

    print(f"\nAll done! Total new verses: {total}")


if __name__ == "__main__":
    main()
