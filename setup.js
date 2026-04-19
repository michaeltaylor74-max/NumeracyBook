/**
 * Password setup helper.
 * Usage:  node setup.js yourChosenPassword
 * Copy the printed hash into ADMIN_PASSWORD_HASH in your .env file.
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node setup.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nAdd this line to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
