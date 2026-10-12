// Creates shopsphere/.env from .env.example and fills in a random JWT_SECRET.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const example = path.join(root, '.env.example');
const target = path.join(root, '.env');

if (fs.existsSync(target)) {
  console.log('.env already exists - leaving it untouched.');
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString('hex');
const content = fs
  .readFileSync(example, 'utf8')
  .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);

fs.writeFileSync(target, content);
console.log('Created .env with a new random JWT_SECRET.');
console.log('Next: open the ".env" file in the project root and set DB_PASSWORD to your MySQL password.');
