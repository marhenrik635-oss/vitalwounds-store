import sqlite3
import os
import bcrypt

db_path = os.path.join(os.path.expanduser("~"), "vitalwounds-api", "database.db")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    username = "admin"
    password = "Jatijati10"
    email = "admin@vitalwounds.my.id"
    role = "admin"

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    existing_user = cursor.fetchone()

    if existing_user:
        cursor.execute("UPDATE users SET email = ?, password = ?, role = ? WHERE username = ?",
                       (email, hashed_password, role, username))
        print(f"Admin user '{username}' updated.")
    else:
        cursor.execute("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                       (username, email, hashed_password, role))
        print(f"Admin user '{username}' created.")

    conn.commit()
    conn.close()
except ImportError:
    print("Error: 'bcrypt' module not found.")
except sqlite3.Error as e:
    print(f"SQLite error: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
