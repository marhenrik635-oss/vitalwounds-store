import sqlite3
conn = sqlite3.connect('/home/ubuntu/vitalwounds-api/database.db')
try:
    conn.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "member"')
    print("Role added")
except:
    print("Role already exists")
try:
    conn.execute('ALTER TABLE users ADD COLUMN tier TEXT DEFAULT "Regular"')
    print("Tier added")
except:
    print("Tier already exists")
conn.commit()
conn.close()