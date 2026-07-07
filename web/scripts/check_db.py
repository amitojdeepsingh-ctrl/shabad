import sqlite3, os

db = r"C:\Users\amito\ALL My AI\07-SHARED-PROJECTS\OpenCode-Work\shabad\web\data\gurugranth.db"
conn = sqlite3.connect(db)
vs = conn.execute("SELECT COUNT(*) FROM verses").fetchone()[0]
la = conn.execute("SELECT value FROM metadata WHERE key='last_ang'").fetchone()
min_a = conn.execute("SELECT MIN(ang) FROM verses").fetchone()[0]
max_a = conn.execute("SELECT MAX(ang) FROM verses").fetchone()[0]
conn.close()

print(f"Verses: {vs:,}")
print(f"Angs: {min_a} to {max_a}")
print(f"Last scraped: {la[0] if la else 'none'}")
print(f"File size: {os.path.getsize(db)/1024/1024:.1f} MB")
