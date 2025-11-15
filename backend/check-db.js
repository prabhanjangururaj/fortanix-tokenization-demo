const db = require('./database');

console.log('\n=== RAW DATABASE CONTENT ===\n');

try {
  const rows = db.getAllRecords();

  if (rows.length === 0) {
    console.log('No records found in database.');
    process.exit(0);
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
    console.log('');
  });
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
