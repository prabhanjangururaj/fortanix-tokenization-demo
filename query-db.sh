#!/bin/bash
# Helper script to query the database in the Docker container

QUERY="${1:-SELECT * FROM records ORDER BY created_at DESC}"

docker exec fortanix-backend node -e "
const Database = require('better-sqlite3');
const db = new Database('/app/database.sqlite');
try {
  const rows = db.prepare(\`${QUERY}\`).all();
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
"
