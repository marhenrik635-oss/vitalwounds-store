import sqlite3
import json

conn = sqlite3.connect('/home/ubuntu/vitalwounds-api/database.db')
cursor = conn.cursor()

# Get users
cursor.execute("SELECT id, username, role FROM users")
print("=== USERS ===")
for r in cursor.fetchall():
    print(r)

# Get tickets
cursor.execute("SELECT * FROM tickets")
print("\n=== TICKETS ===")
for r in cursor.fetchall():
    print(r)

conn.close()