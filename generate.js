/**
 * updateAccounts.js
 *
 * Fungsi:
 *  - Baca file `accounts.txt`
 *  - Ekstrak hanya `email` dan `token`
 *  - Tulis ulang (overwrite) `accounts.js` dengan data baru
 *
 * Cara menjalankan:
 *   node updateAccounts.js
 */

const fs = require('fs');
const path = require('path');

// 1. Baca file accounts.txt
const rawText = fs.readFileSync(path.join(__dirname, 'accounts.txt'), 'utf8');

// 2. Pisahkan menjadi array baris
const lines = rawText.split('\n');

// 3. Siapkan array penampung
const newAccounts = [];
let currentAccount = {};

// 4. Loop setiap baris dan parsing
for (let line of lines) {
  line = line.trim();
  
  // Lewati baris kosong atau pemisah
  if (!line || line.startsWith('---')) {
    continue;
  }

  if (line.startsWith('Email: ')) {
    // Jika currentAccount sudah berisi data akun sebelumnya, push terlebih dulu
    if (Object.keys(currentAccount).length > 0) {
      newAccounts.push(currentAccount);
    }
    // Mulai objek baru, reset currentAccount
    currentAccount = {};
    currentAccount.email = line.replace('Email: ', '').trim();
  } 
  else if (line.startsWith('Token: ')) {
    currentAccount.token = line.replace('Token: ', '').trim();
  }
}

// Setelah loop, push akun terakhir (jika ada)
if (Object.keys(currentAccount).length > 0) {
  newAccounts.push(currentAccount);
}

// 5. Buat isi file baru: hanya array of object dengan email & token
const output = 'module.exports = ' + JSON.stringify(newAccounts, null, 2) + ';\n';

// 6. Tulis ke file accounts.js (overwrite)
fs.writeFileSync(path.join(__dirname, 'accounts.js'), output, 'utf8');

console.log('Berhasil memperbarui file accounts.js (email & token).');
