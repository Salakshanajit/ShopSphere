const env = require('./config/env');

try {
  env.assertConfig();
} catch (err) {
  console.error(`\n[config] ${err.message}\n`);
  process.exit(1);
}

const pool = require('./config/db');
const app = require('./app');

async function start() {
  // Fail early with a friendly message if MySQL is not reachable.
  try {
    await pool.query('SELECT 1');
    await pool.query('SELECT 1 FROM products LIMIT 1');
  } catch (err) {
    console.error('\n[database] Could not use the MySQL database.');
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_DB_ERROR') {
      console.error('           The database/tables do not exist yet. Run: npm run db:init');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('           Wrong DB_USER or DB_PASSWORD in your .env file.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`           MySQL is not running on ${env.DB.host}:${env.DB.port}. Start the MySQL service.`);
    } else {
      console.error(`           ${err.code || ''} ${err.message}`);
    }
    console.error('');
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`ShopSphere API running at http://localhost:${env.PORT}/api`);
    console.log(`Allowed client origins: ${env.CLIENT_ORIGINS.join(', ')}`);
  });
}

start();
