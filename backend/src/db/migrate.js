// SQLite auto-initializes the schema on require — nothing extra to run.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
require('./database');
console.log('Migration complete (SQLite schema applied on startup).');
