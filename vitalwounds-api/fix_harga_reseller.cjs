const fs = require('fs');
let c = fs.readFileSync('index.js', 'utf8').replace(/\r\n/g, '\n');

 // FIX 1: Reseller endpoint productsWithResellerPrices
 const oldCode1 = `        const productsWithResellerPrices = await Promise.all(transformedProducts.map(async (p) => {
            const cached = cachedMap.get(p.id);
            const hargaModal = (cached && cached.harga_modal) ? cached.harga_modal : (p.price_min || 0);
            const resellerProfit = (cached && cached.reseller_profit) ? cached.reseller_profit : 2000;
            const resellerPrice = hargaModal + resellerProfit;
            const discountPct = p.price_min > 0 ? Math.round(((p.price_min - resellerPrice) / p.price_min) * 100) : 0;`;

const newCode1 = `        const productsWithResellerPrices = await Promise.all(transformedProducts.map(async (p) => {
            const cached = cachedMap.get(p.id);
            // Harga reseller = harga retail DIKURANG diskon (sebelumnya: cost + profit -> bikin mahal)
            // reseller_profit di sini berarti BESARAN DISKON dari harga retail (default 2000 = potongan 2K)
            const retailPrice = p.price_min || 0;
            const resellerDiscount = (cached && cached.reseller_profit) ? cached.reseller_profit : 2000;
            // Pastikan reseller price tidak kurang dari 30% harga retail (batas aman) dan minimal 1K
            const resellerPrice = Math.max(1000, Math.round(retailPrice * 0.3), retailPrice - resellerDiscount);
            const discountPct = retailPrice > 0 ? Math.round(((retailPrice - resellerPrice) / retailPrice) * 100) : 0;
            const hargaModal = (cached && cached.harga_modal > 0) ? cached.harga_modal : Math.round(retailPrice * 0.85);`;

if (c.includes(oldCode1)) {
    c = c.replace(oldCode1, newCode1);
    console.log('FIX 1: Reseller endpoint pricing logic BERHASIL diubah');
} else {
    console.log('FIX 1: GAGAL - teks tidak ditemukan!');
    process.exit(1);
}

// FIX 2: Pay endpoint - change from totalPrice+profit to totalPrice-discount
const oldCode2 = `                    // For reseller: charge modal + profit instead of full price
                    let finalPrice = isReseller ? (totalPrice + resellerProfit) : totalPrice;
                    if (isReseller) {
                        console.log('[Reseller] cost=' + totalPrice + ' profit=' + resellerProfit + ' finalPrice=' + finalPrice);
                    }`;

const newCode2 = `                    // For reseller: charge totalPrice MINUS discount (sebelumnya: totalPrice + profit -> bikin mahal)
                    let finalPrice = isReseller ? Math.max(1000, Math.round(totalPrice * 0.3), totalPrice - resellerProfit) : totalPrice;
                    if (isReseller) {
                        console.log('[Reseller] cost=' + totalPrice + ' profit=' + resellerProfit + ' finalPrice=' + finalPrice);
                    }`;

if (c.includes(oldCode2)) {
    c = c.replace(oldCode2, newCode2);
    console.log('FIX 2: Pay endpoint pricing logic BERHASIL diubah');
} else {
    console.log('FIX 2: GAGAL - teks tidak ditemukan!');
    process.exit(1);
}

fs.writeFileSync('index.js', c, 'utf8');
console.log('File berhasil disimpan!');
console.log('Perubahan:');
console.log('- Reseller endpoint: reseller_price = retailPrice - discount (bukan cost + profit)');
console.log('- Pay endpoint: finalPrice = totalPrice - discount (bukan totalPrice + profit)');
console.log('- Default discount: 2000 (reseller_profit dari DB)');
console.log('- Safety: minimal 30% dari retailPrice dan minimal 1000');
