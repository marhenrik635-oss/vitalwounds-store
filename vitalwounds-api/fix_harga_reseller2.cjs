const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8').replace(/\r\n/g, '\n');

// Check if there's a ReferenceError risk in the return statement
if (c.includes('reseller_profit: resellerProfit,')) {
    c = c.replace('reseller_profit: resellerProfit,', 'reseller_profit: resellerDiscount,');
    console.log('FIX 3: Return statement reference BERHASIL diperbaiki (resellerProfit -> resellerDiscount)');
} else {
    console.log('FIX 3: Mencari alternatif...');
    // Check if already fixed
    if (c.includes('reseller_profit: resellerDiscount,')) {
        console.log('Sudah benar (reseller_profit: resellerDiscount)');
    } else {
        console.log('GAGAL: Tidak menemukan teks yang perlu diperbaiki');
        // Debug: show context around reseller_profit:
        const idx = c.indexOf('reseller_profit:');
        if (idx > -1) {
            console.log('Context:', c.substring(Math.max(0, idx - 30), idx + 60));
        }
        process.exit(1);
    }
}

fs.writeFileSync('index.js', c, 'utf8');
console.log('File berhasil disimpan!');
