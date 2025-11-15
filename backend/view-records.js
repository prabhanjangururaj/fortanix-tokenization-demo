const db = require('./database');

console.log('\n=== QUERYING RECORDS TABLE ===\n');

db.all('SELECT * FROM records', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('No records found in database.');
    return;
  }

  console.log(`Found ${rows.length} record(s):\n`);

  rows.forEach((row, index) => {
    console.log(`=== RECORD ${index + 1} ===`);
    console.log('ID:', row.id);
    console.log('Name (tokenized):', row.name.substring(0, 50) + '...');
    console.log('Phone (tokenized):', row.phone.substring(0, 50) + '...');
    console.log('Email (tokenized):', row.email.substring(0, 50) + '...');
    console.log('SSN (tokenized):', row.ssn.substring(0, 50) + '...');
    console.log('Account Number (tokenized):', row.accountNumber.substring(0, 50) + '...');
    console.log('Service Request:', row.serviceRequest);
    console.log('Created By:', row.createdBy);
    console.log('Created At:', row.createdAt);
    console.log('');
  });

  db.close(() => {
    console.log('Done!');
  });
});
