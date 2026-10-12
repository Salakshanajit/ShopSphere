// Loads settings from the .env file in the project root (shopsphere/.env).
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// Allow both "localhost" and "127.0.0.1" variants of every client origin.
const clientOrigins = new Set();
for (const origin of toList(process.env.CLIENT_URL || 'http://localhost:5173')) {
  clientOrigins.add(origin);
  clientOrigins.add(origin.replace('localhost', '127.0.0.1'));
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGINS: [...clientOrigins],
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shopsphere',
  },
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Called when the API starts so that mistakes are reported clearly.
  assertConfig() {
    if (env.JWT_SECRET.length < 16) {
      throw new Error(
        'JWT_SECRET is missing or too short. Run "npm run setup" in the server folder ' +
          'to generate a .env file, or set JWT_SECRET in .env to a long random text.'
      );
    }
  },
};

module.exports = env;
