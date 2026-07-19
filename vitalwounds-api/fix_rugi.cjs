const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8').replace(/\r\n/g, '\n');

// Fix pay endpoint: add totalPrice to Math.max to ensure no loss
const oldCode = `Math.max(1000, Math.round(totalPrice * 0.3), totalPrice - resellerProfit)`;
const newCode = `Math.max(totalPrice, 1000, Math.round(totalPrice * 0.3), totalPrice - resellerProfit)`;

if (c.includes(oldCode)) {
    c = c.replace(oldCode, newCode);
    console.log('FIX RUGI: Pay endpoint BERHASIL diperbaiki (ditambah totalPrice di Math.max)');
    console.log('Sekarang finalPrice >= totalPrice, tidak akan rugi');
} else {
    console.log('FIX RUGI: GAGAL - teks tidak ditemukan!');
    process.exit(1);
}

fs.writeFileSync('index.js', c, 'utf8');
console.log('File berhasil disimpan!');
