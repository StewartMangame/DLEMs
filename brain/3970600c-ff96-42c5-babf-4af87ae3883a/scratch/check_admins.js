
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/loan_db.sqlite');

db.all("SELECT id, email, fullName, role FROM admin_user", [], (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  db.close();
});
