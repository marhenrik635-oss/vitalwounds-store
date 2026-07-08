import sqlite3
conn = sqlite3.connect('/home/ubuntu/vitalwounds-api/database.db')
conn.execute("INSERT OR REPLACE INTO users (username, email, password) VALUES ('vitalwounds', 'vitalwounds@vitalwounds.my.id', 'dummy_hash')")
conn.commit()
conn.close()
print("User inserted!")