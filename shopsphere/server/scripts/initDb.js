// Creates the database and tables (database/schema.sql) and loads sample products
// (database/seed.sql) when the products table is empty.
//   npm run db:init     -> safe to run many times, never deletes data
//   npm run db:reset    -> DROPS the shopsphere database first, then recreates everything
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

const DATABASE = 'shopsphere'; // must match database/schema.sql
const dbDir = path.resolve(__dirname, '../../database');

async function main() {
  if (env.DB.database !== DATABASE) {
    console.error(`DB_NAME in .env is "${env.DB.database}" but database/schema.sql creates "${DATABASE}". Set DB_NAME=${DATABASE}.`);
    process.exit(1);
  }

  const reset = process.argv.includes('--reset');
  const connection = await mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    multipleStatements: true,
  });

  try {
    if (reset) {
      console.log(`Dropping database "${DATABASE}" (reset requested)...`);
      await connection.query(`DROP DATABASE IF EXISTS \`${DATABASE}\``);
    }

    console.log('Creating database and tables...');
    await connection.query(fs.readFileSync(path.join(dbDir, 'schema.sql'), 'utf8'));
    await connection.query(`USE \`${DATABASE}\``);

    const [[{ total }]] = await connection.query('SELECT COUNT(*) AS total FROM products');
    if (total === 0) {
      console.log('Loading sample products...');
      await connection.query(fs.readFileSync(path.join(dbDir, 'seed.sql'), 'utf8'));
      const [[{ loaded }]] = await connection.query('SELECT COUNT(*) AS loaded FROM products');
      console.log(`Inserted ${loaded} sample products.`);
    } else {
      console.log(`Products table already has ${total} rows - sample data not added.`);
    }
    console.log('Database is ready.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('\nDatabase setup failed.');
  if (err.code === 'ECONNREFUSED') {
    console.error(`Cannot connect to MySQL at ${env.DB.host}:${env.DB.port}. Make sure the MySQL service is running.`);
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL rejected the login. Check DB_USER and DB_PASSWORD in your .env file.');
  } else {
    console.error(`${err.code || 'Error'}: ${err.message}`);
  }
  process.exit(1);
});
