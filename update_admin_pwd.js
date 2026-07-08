const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('/home/ubuntu/vitalwounds-api/database.db');
const hash = bcrypt.hashSync('Jatijati10', 10);

db.run("INSERT OR REPLACE INTO users (username, email, password, role) VALUES ('admin', 'admin@vitalwounds.my.id', ?, 'admin')", [hash], (err) => {
  if (err) console.error(err);
  else console.log("Admin user password updated!");
  db.close();
});