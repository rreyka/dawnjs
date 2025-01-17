const fs = require('fs');
const path = require('path');

const rawText = fs.readFileSync(path.join(__dirname, 'accounts.txt'), 'utf8');
const lines = rawText.split('\n');

const newAccounts = [];
let currentAccount = {};

for (let line of lines) {
  line = line.trim();

  if (!line || line.startsWith('---')) {
    continue;
  }

  if (line.startsWith('Email: ')) {
    if (currentAccount.email && currentAccount.password && currentAccount.token) {
      newAccounts.push(currentAccount);
    }
    currentAccount = {};
    currentAccount.email = line.replace('Email: ', '').trim();
  } else if (line.startsWith('Password: ')) {
    currentAccount.password = line.replace('Password: ', '').trim();
  } else if (line.startsWith('Token: ')) {
    currentAccount.token = line.replace('Token: ', '').trim();
  }
}

if (currentAccount.email && currentAccount.password && currentAccount.token) {
  newAccounts.push(currentAccount);
}

const output = 'module.exports = ' + JSON.stringify(newAccounts.map(account => ({
  email: account.email,
  token: account.token
})), null, 2) + '\n';

fs.writeFileSync(path.join(__dirname, 'accounts.js'), output, 'utf8');

console.log('Berhasil memperbarui file accounts.js (hanya email & token lengkap).');
