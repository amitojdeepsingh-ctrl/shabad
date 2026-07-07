"""Seed database with initial Angs for testing."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from scrape_gurugranth import scrape_ang, init_db

def seed(angs: list[int]):
    conn = init_db()
    cursor = conn.cursor()
    for ang in angs:
        verses = scrape_ang(ang)
        if verses:
            cursor.executemany(
                "INSERT OR IGNORE INTO verses (ang, line_number, gurmukhi, transliteration, translation, raag, author) VALUES (?, ?, ?, ?, ?, ?, ?)",
                verses
            )
            conn.commit()
        print(f"Ang {ang}: {len(verses)} verses")
    conn.close()

if __name__ == "__main__":
    seed([1, 2, 3, 4, 5, 10, 25, 50, 100])
