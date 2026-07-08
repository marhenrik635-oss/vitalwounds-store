
import sqlite3
import os

db_path = os.path.join(os.path.expanduser("~"), "vitalwounds-api", "database.db")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT username, email, role FROM users WHERE username = 'Vitalwounds';")
    result = cursor.fetchone()
    print(result)
    conn.close()
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
