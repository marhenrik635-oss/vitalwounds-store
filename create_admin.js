const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('/home/ubuntu/vitalwounds-api/database.db');

const username = "admin";
const password = "Jatijati10";
const email = "admin@vitalwounds.my.id";
const role = "admin";

const hashedPassword = bcrypt.hashSync(password, 10);

db.run(
    'INSERT INTO users (username, email, password, balance, role, tier) VALUES (?, ?, ?, ?, ?, ?)',
    [username, email, hashedPassword, 1000000, role, 'VIP'],
    function(err) {
        if (err && err.message.indexOf('UNIQUE') !== -1) {
            db.run(
                'UPDATE users SET password = ?, role = ?, balance = ? WHERE username = ?',
                [hashedPassword, 'admin', 1000000, 'admin'],
                function() { console.log('Admin user updated (already exists)'); db.close(); }
            );
        } else if (err) {
            console.error('Error creating admin user:', err.message);
            db.close();
        } else {
            console.log('Admin user created successfully.');
            db.close();
        }
    }
);