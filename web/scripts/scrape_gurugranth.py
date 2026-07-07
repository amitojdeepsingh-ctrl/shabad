"""
Scrape all 1,430 Angs of Sri Guru Granth Sahib from srigurugranth.net
Each page has triplets: Gurmukhi (class=Gurb), Roman transliteration, English translation (class=Trans).
"""
import re
import sqlite3
import time
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
            author TEXT DEFAULT ''
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ang ON verses(ang)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    conn.commit()
    return conn


def extract_raag_from_page(soup, ang):
    """Extract raag and author from page header area."""
    all_p = soup.body.find_all("p") if soup.body else []
    text_before = []
    for p in all_p:
        cls = p.get("class", [""])[0]
        txt = p.get_text(strip=True)
        if cls == "Gurb":
            break
        if txt and not txt.startswith("[") and not txt.startswith("("):
            text_before.append(txt)
    header = " ".join(text_before)
    raag = ""
    author = ""
    if "Raag" in header:
        m = re.search(r"Raag\s+([\w\s]+?)(?:,|\s*$)", header)
        if m:
            raag = m.group(1).strip()
    for guru in ["Guru Nanak Dev", "Guru Angad Dev", "Guru Amar Das", "Guru Ram Das",
                  "Guru Arjan Dev", "Guru Tegh Bahadur", "Guru Gobind Singh"]:
        if guru in header:
            author = guru
            break
    # Also check for Mahala patterns
    mahala_match = re.search(r"Mahala\s*(\d+)", header, re.IGNORECASE)
    if mahala_match:
        num = mahala_match.group(1)
        authors = {1: "Guru Nanak Dev", 2: "Guru Angad Dev", 3: "Guru Amar Das",
                   4: "Guru Ram Das", 5: "Guru Arjan Dev"}
        author = authors.get(int(num), author)
    return raag, author


def parse_page(html: str, ang: int):
    soup = BeautifulSoup(html, "html.parser")
    raag, author = extract_raag_from_page(soup, ang)
    verses = []

    if not soup.body:
        return verses

    current_gurmukhi = ""
    current_roman = ""
    line_number = 0

    for p in soup.body.find_all("p"):
        cls_list = p.get("class", [])
        cls = cls_list[0] if cls_list else ""
        text = p.get_text(strip=True)

        if not text:
            continue

        if cls == "Gurb":
            if current_gurmukhi and current_roman:
                line_number += 1
                verses.append((ang, line_number, "", current_roman, current_gurmukhi, raag, author))
            current_gurmukhi = text
            current_roman = ""
        elif cls == "Roman":
            current_roman = text
        elif cls == "Trans":
            if current_gurmukhi and current_roman:
                line_number += 1
                verses.append((ang, line_number, current_gurmukhi, current_roman, text, raag, author))
            current_gurmukhi = ""
            current_roman = ""

    return verses


def scrape_ang(ang: int):
    url = f"{BASE_URL}{ang:04d}.html"
    resp = requests.get(url, timeout=30, headers={
        "User-Agent": "Mozilla/5.0 (compatible; ShabadBot/1.0)"
    })
    resp.raise_for_status()
    resp.encoding = "utf-8"
    return parse_page(resp.text, ang)


def scrape_all():
    conn = init_db()
    cursor = conn.cursor()

    cursor.execute("SELECT value FROM metadata WHERE key='last_ang'")
    row = cursor.fetchone()
    start_ang = int(row[0]) + 1 if row else 1

    for ang in range(start_ang, 1431):
        try:
            verses = scrape_ang(ang)
            if verses:
                cursor.executemany(
                    "INSERT OR IGNORE INTO verses (ang, line_number, gurmukhi, transliteration, translation, raag, author) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    verses
                )
                conn.commit()
            cursor.execute(
                "INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_ang', ?)",
                (str(ang),)
            )
            conn.commit()
            print(f"  Ang {ang}: {len(verses)} verses")
        except Exception as e:
            print(f"  Ang {ang}: ERROR - {e}")

        time.sleep(0.5)

    conn.close()
    print("Done scraping all Angs.")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        verses = scrape_ang(1)
        print(f"Ang 1: {len(verses)} verses")
        for v in verses[:3]:
            print(f"  Gurmukhi: {v[2][:60]}...")
            print(f"  Roman: {v[3][:60]}...")
            print(f"  Trans: {v[4][:60]}...")
            print()
    else:
        print("Scraping Sri Guru Granth Sahib...")
        scrape_all()
