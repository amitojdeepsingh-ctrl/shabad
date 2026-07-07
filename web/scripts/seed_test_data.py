"""
Seed the database with a few sample Angs for testing.
Scrapes Ang 1 from srigurugranth.net and adds test data.
"""
import re
import sqlite3
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://srigurugranth.net/"
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "gurugranth.db"


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS verses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ang INTEGER NOT NULL,
            line_number INTEGER NOT NULL,
            gurmukhi TEXT,
            transliteration TEXT,
            translation TEXT,
            raag TEXT DEFAULT '',
            author TEXT DEFAULT '',
            section TEXT DEFAULT ''
        )
    """)
    conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_ang ON verses(ang)
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    conn.commit()
    return conn


def parse_page(html: str, ang: int):
    soup = BeautifulSoup(html, "html.parser")
    verses = []
    body = soup.find("body")
    if not body:
        return verses

    lines = body.get_text("\n").split("\n")

    raag = ""
    author = ""
    line_idx = 0

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.isdigit() and int(stripped) == ang:
            line_idx = i + 1
            break

    content_lines = []
    for line in lines[line_idx:]:
        stripped = line.strip()
        if stripped and not stripped.startswith("[") and stripped != "||":
            content_lines.append(stripped)

    i = 0
    verse_number = 0
    while i < len(content_lines) - 2:
        gurmukhi = content_lines[i]
        if not re.search(r'[\u0A00-\u0A7F]', gurmukhi):
            i += 1
            continue

        transliteration_line = content_lines[i + 1] if i + 1 < len(content_lines) else ""
        translation_line = content_lines[i + 2] if i + 2 < len(content_lines) else ""

        if re.search(r'[\u0A00-\u0A7F]', transliteration_line):
            i += 1
            continue

        if len(translation_line) < 5:
            i += 1
            continue

        verse_number += 1
        verses.append((ang, verse_number, gurmukhi, transliteration_line, translation_line, raag, ""))
        i += 3

    return verses


def seed_test_data():
    conn = init_db()
    cursor = conn.cursor()

    # Scrape first 3 Angs for testing
    for ang in [1, 2, 3]:
        url = f"{BASE_URL}{ang:04d}.html"
        print(f"Fetching {url}...")
        try:
            resp = requests.get(url, timeout=30, headers={
                "User-Agent": "Mozilla/5.0 (compatible; ShabadBot/1.0)"
            })
            resp.raise_for_status()
            verses = parse_page(resp.text, ang)
            if verses:
                cursor.executemany(
                    "INSERT OR IGNORE INTO verses (ang, line_number, gurmukhi, transliteration, translation, raag, author) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    verses
                )
                conn.commit()
                print(f"  Ang {ang}: {len(verses)} verses")
        except Exception as e:
            print(f"  Error: {e}")

    conn.close()
    print(f"Database ready at {DB_PATH}")


if __name__ == "__main__":
    seed_test_data()
