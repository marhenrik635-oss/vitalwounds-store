const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8').replace(/\r\n/g, '\n');

// Fix pay endpoint: remove totalPrice from Math.max to match DISPLAYED reseller price
const oldCode = `Math.max(totalPrice, 1000, Math.round(totalPrice * 0.3), totalPrice - resellerProfit)`;
const newCode = `Math.max(1000, Math.round(totalPrice * 0.3), totalPrice - resellerProfit)`;

if (c.includes(oldCode)) {
    c = c.replace(oldCode, newCode);
    console.log('FIX KONSISTENSI: Pay endpoint BERHASIL diperbaiki');
    console.log('Sekarang finalPrice = display price (reseller_price), konsisten dengan yang ditampilkan');
    console.log('Catatan: Store bisa rugi jika resellerProfit > margin. User said will adjust prices later.');
} else {
    console.log('FIX KONSISTENSI: GAGAL - teks tidak ditemukan!');
    // Check if already fixed
    if (c.includes('totalPrice, 1000, Math.round(totalPrice * 0.3)') && !c.includes('Math.max(totalPrice, 1000, Math.round(totalPrice * 0.3), totalPrice - resellerProfit)')) {
        const idx = c.indexOf('Math.max');
        const snippet = c.substring(idx, idx+100);
        console.log('Found near Math.max:', snippet);
    }
    process.exit(1);
}

fs.writeFileSync('index.js', c, 'utf8');
console.log('File berhasil disimpan!');
