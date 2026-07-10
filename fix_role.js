const path = require('path');
const modulePath = path.join(process.env.HOME || '/home/ubuntu', 'vitalwounds-api', 'node_modules');
const sqlite3 = require(modulePath + '/sqlite3').verbose();

const dbPath = path.join(process.env.HOME || '/home/ubuntu', 'vitalwounds-api', 'database.db');
const db = new sqlite3.Database(dbPath);

const email = 'kaliankontol1@gmail.com';

db.run('UPDATE users SET role = ? WHERE email = ?', ['owner', email], function(err) {
  if (err) {
    console.log('ERROR:', err.message);
  } else {
    console.log('ROLE_FIXED - changes:', this.changes);
  }
  
  db.get('SELECT username, email, role FROM users WHERE email = ?', [email], function(err2, row) {
    if (row) {
      console.log('USER:', JSON.stringify(row));
    } else {
      console.log('USER NOT FOUND in database');
      // List all users for debugging
      db.all('SELECT username, email, role FROM users', function(err3, rows) {
        console.log('ALL USERS:', JSON.stringify(rows));
        db.close();
      });
      return;
    }
    db.close();
  });
});
