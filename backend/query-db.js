const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

console.log('\n=== QUERYING RECORDS TABLE ===\n');

db.all('SELECT * FROM records', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('No records found in database.');
    db.close();
    return;
  }

  console.log(`Found ${rows.length} record(s):\n`);

  rows.forEach((row, index) => {
    console.log(`=== RECORD ${index + 1} ===`);
    console.log('ID:', row.id);
    console.log('Name:', row.name);
    console.log('Phone:', row.phone);
    console.log('Email:', row.email);
    console.log('SSN:', row.ssn);
    console.log('Account Number:', row.accountNumber);
    console.log('Service Request:', row.serviceRequest);
    console.log('Created By:', row.createdBy);
    console.log('Created At:', row.createdAt);
    console.log('');
  });

  db.close();
});
