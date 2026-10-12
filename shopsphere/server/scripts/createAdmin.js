// Creates the first ADMIN account (or promotes an existing account to ADMIN).
// There is intentionally NO public admin registration in the web app.
//
//   npm run create-admin
//
// The script asks for name, email and password. If ADMIN_NAME, ADMIN_EMAIL and
// ADMIN_PASSWORD are all set in .env it runs without asking questions.
const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');
const { validateRegister } = require('../src/utils/validators');

function createPrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl.muted = false;
  const originalWrite = rl._writeToOutput;
  rl._writeToOutput = function writeToOutput(text) {
    if (rl.muted && text.trim() !== '' && !text.includes('Password')) {
      rl.output.write('*');
    } else {
      originalWrite.call(rl, text);
    }
  };
  const ask = (question, { hidden = false } = {}) =>
    new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.muted = false;
        if (hidden) process.stdout.write('\n');
        resolve(answer);
      });
      rl.muted = hidden;
    });
  return { ask, close: () => rl.close() };
}

async function main() {
  let name = process.env.ADMIN_NAME || '';
  let email = process.env.ADMIN_EMAIL || '';
  let password = process.env.ADMIN_PASSWORD || '';

  if (!(name && email && password)) {
    const prompt = createPrompt();
    const nameAnswer = await prompt.ask(`Admin name [${name || 'Store Admin'}]: `);
    name = nameAnswer.trim() || name || 'Store Admin';
    const emailAnswer = await prompt.ask(`Admin email [${email || 'admin@shopsphere.local'}]: `);
    email = emailAnswer.trim() || email || 'admin@shopsphere.local';
    password = await prompt.ask('Admin password (min 8 characters, letters + numbers): ', { hidden: true });
    prompt.close();
  }

  const { value, errors } = validateRegister({ name, email, password });
  if (errors) {
    console.error('\nCannot create the admin:');
    Object.values(errors).forEach((message) => console.error(` - ${message}`));
    process.exitCode = 1;
    return;
  }

  const [existing] = await pool.execute('SELECT id, role FROM users WHERE email = ?', [value.email]);
  if (existing.length) {
    if (existing[0].role === 'ADMIN') {
      console.log(`\n${value.email} is already an ADMIN. Nothing changed.`);
    } else {
      await pool.execute("UPDATE users SET role = 'ADMIN' WHERE id = ?", [existing[0].id]);
      console.log(`\nExisting account ${value.email} was promoted to ADMIN (its password was not changed).`);
    }
    return;
  }

  const hash = await bcrypt.hash(value.password, 10);
  await pool.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
    [value.name, value.email, hash]
  );
  console.log(`\nAdmin account created for ${value.email}. You can now log in at http://localhost:5173/login`);
}

main()
  .catch((err) => {
    if (err.code === 'ECONNREFUSED') {
      console.error('Cannot connect to MySQL. Make sure it is running.');
    } else if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_DB_ERROR') {
      console.error('The database tables are missing. Run "npm run db:init" first.');
    } else {
      console.error(`${err.code || 'Error'}: ${err.message}`);
    }
    process.exitCode = 1;
  })
  .finally(() => pool.end());
