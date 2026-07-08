const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('/home/ubuntu/vitalwounds-api/database.db');

const username = "admin";
const password = "Jatijati10";
const email = "admin@vitalwounds.my.id";
const role = "admin";

const hashedPassword = bcrypt.hashSync(password, 10);

db.run(
    'INSERT OR REPLACE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, role],
    (err) => {
        if (err) {
            console.error('Error creating admin user:', err.message);
        } else {
            console.log('Admin user created successfully.');
        }
        db.close();
    }
);