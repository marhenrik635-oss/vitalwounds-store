const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Resend } = require('resend');
require('dotenv').config();

const RESEND_KEY = process.env.RESEND_KEY || 're_Ctid2TWY_QF185qEGAkQDgJQit9CfkSmQ';
const resend = new Resend(RESEND_KEY);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Anti-crash for bad JSON payloads
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON received:', err.message);
        return res.status(400).json({ error: 'Format JSON tidak valid' });
    }
    next();
});

// Global anti-crash handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
});

// API Endpoints
const XOFTWARE_API_KEY = process.env.XOFTWARE_API_KEY;
const XOFTWARE_API_BASE_URL = 'https://backend-s2.xoftware.id/v1';
const XOFTWARE_WEB_BASE_URL = 'https://web.xoftware.id/api/v2/web';
const XOFTWARE_JWT = process.env.XOFTWARE_JWT;

const db = new sqlite3.Database('./database.db');

async function fetchProductsFromXoftware() {
    try {
        const response = await axios.get(`${XOFTWARE_API_BASE_URL}/product`, {
            headers: {
                'X-API-Key': XOFTWARE_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        return response.data.data; // The products array
    } catch (e) {
        console.error('Failed to fetch products from Xoftware:', e.message);
        return [];
    }
}

async function getGlobalProductsData() {
    const dataMap = {};
    try {
        let page = 1;
        let totalPages = 1;
        do {
            const response = await axios.post(`${XOFTWARE_WEB_BASE_URL}/products/list`, { 
                clientName: 'Djati',
                page: page
            }, {
                headers: {
                    'authorization': `Bearer ${XOFTWARE_JWT}`,
                    'cookie': 'SRVGROUP=common',
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
                },
                timeout: 5000
            });
            if (response.data && response.data.data && response.data.data.data) {
                response.data.data.data.forEach(p => {
                    dataMap[p.id] = {
                        sold: p.sold || 0,
                        stock: p.available_stock || 0,
                        imageUrl: p.thumbnail ? (p.thumbnail.startsWith('http') ? p.thumbnail : `https://s3.xoftware.id${p.thumbnail}`) : null
                    };
                });
                totalPages = response.data.data.totalPages || 1;
            } else {
                break;
            }
            page++;
        } while (page <= totalPages);
    } catch (e) {
        console.error('Failed to fetch global products data:', e.message);
    }
    return dataMap;
}

db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, balance INTEGER DEFAULT 0, phone TEXT DEFAULT '')`);
db.run(`CREATE TABLE IF NOT EXISTS otp_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, otp TEXT, expiredAt INTEGER, verified INTEGER DEFAULT 0)`);
db.run(`CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    username TEXT,
    amount INTEGER,
    status TEXT,
    transactionId TEXT UNIQUE,
    createdAt INTEGER
)`);
db.run(`CREATE TABLE IF NOT EXISTS product_cache (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    stock INTEGER,
    description TEXT,
    category TEXT,
    icon TEXT,
    price_min INTEGER,
    price_max INTEGER,
    displayPrice TEXT,
    is_variation INTEGER,
    variations TEXT,
    imageUrl TEXT,
    snk TEXT,
    updatedAt INTEGER
)`);
// Add snk column for existing databases (safe even if column exists)
db.run(`ALTER TABLE product_cache ADD COLUMN snk TEXT`, (err) => { if (err && !err.message.includes('duplicate') && !err.message.includes('already exists')) console.error('ALTER TABLE snk:', err.message); });

const productCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 menit

const getCachedProducts = (ids) => {
    return new Promise((resolve, reject) => {
        const placeholders = ids.map(() => '?').join(',');
        if (!ids.length) return resolve(new Map());
        db.all(`SELECT * FROM product_cache WHERE id IN (${placeholders})`, ids, (err, rows) => {
            if (err) reject(err);
            else {
                const map = new Map();
                (rows || []).forEach(r => map.set(r.id, r));
                resolve(map);
            }
        });
    });
};

const getCachedProduct = (id) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM product_cache WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const cacheProduct = (p, imageUrl) => {
    return new Promise((resolve, reject) => {
        const query = `
            REPLACE INTO product_cache 
            (id, name, code, stock, description, category, icon, price_min, price_max, displayPrice, is_variation, variations, imageUrl, snk, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(query, [
            String(p.id), p.name, p.code, p.stock, p.description, p.category, p.icon, p.price_min, p.price_max, p.displayPrice,
            p.is_variation ? 1 : 0, JSON.stringify(p.variations || []), imageUrl, p.snk || '', Date.now()
        ], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

function getImageUrlForProduct(title) {
    const t = (title || '').toUpperCase();
    if (t.includes('NETFLIX')) {
        return 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd85?w=500&auto=format&fit=crop&q=60';
    }
    if (t.includes('SPOTIFY') || t.includes('MUSIC')) {
        return 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=500&auto=format&fit=crop&q=60';
    }
    if (t.includes('CANVA') || t.includes('OFFICE') || t.includes('PICSART')) {
        return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&auto=format&fit=crop&q=60';
    }
    if (t.includes('YOUTUBE') || t.includes('YT')) {
        return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60';
    }
    if (t.includes('CAPCUT') || t.includes('WINK') || t.includes('ALIGHT') || t.includes('VIDEO')) {
        return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&auto=format&fit=crop&q=60';
    }
    if (t.includes('GEMINI') || t.includes('GROK') || t.includes('GPT') || t.includes('LEONARDO') || t.includes('AI')) {
        return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=500&auto=format&fit=crop&q=60';
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
}

// Xoftware Proxy
const xoftHeaders = {
    'X-API-Key': XOFTWARE_API_KEY,
    'Content-Type': 'application/json',
    'cookie': 'SRVGROUP=common',
    'origin': 'https://web.xoftware.id',
    'referer': 'https://web.xoftware.id/Djati',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
};

async function fetchRealProductDetailFromXoftware(productId) {
    try {
        const response = await axios.post('https://web.xoftware.id/api/v2/web/products/detail', {
            clientName: 'Djati',
            productId: Number(productId)
        }, {
            headers: {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.6',
                'authorization': `Bearer ${XOFTWARE_JWT}`,
                'content-type': 'application/json',
                'cookie': 'SRVGROUP=common',
                'origin': 'https://web.xoftware.id',
                'referer': 'https://web.xoftware.id/Djati',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });
        
        console.log('Xoftware Response Detail for', productId, ':', JSON.stringify(response.data.data).substring(0, 200));

        if (response.data && response.data.data) {
            const d = response.data.data;
            const snk = d.snk || (d.variations && d.variations.length > 0 ? d.variations[0].snk : 'Tidak ada syarat dan ketentuan.');
            // Cari thumbnail: cek root, lalu cek variations[0].thumbnail/image jika ada
            const img = d.thumbnail || d.image || d.image_url || d.photo || d.picture || (d.variations && d.variations.length > 0 ? (d.variations[0].thumbnail || d.variations[0].image) : null);
            return {
                imageUrl: img ? (img.startsWith('http') ? img : `https://s3.xoftware.id${img}`) : null,
                snk: snk
            };
        }
    } catch (e) {
        console.error(`Failed to fetch real detail for product ${productId}:`, e.message);
    }
    return null;
}

app.get('/api/xoftware/products', async (req, res) => {
    try {
        const response = await axios.get(`${XOFTWARE_API_BASE_URL}/product`, { headers: xoftHeaders });
        const globalData = await getGlobalProductsData();
        
        // Transform and categorize products dynamically
        const rawProducts = response.data.data;
        const transformedProducts = rawProducts.map(p => {
            const title = (p.title || '').toUpperCase();
            let category = 'Streaming'; // fallback default
            let icon = 'Tv';

            if (title.includes('SPOTIFY') || title.includes('MUSIC')) {
                category = 'Music';
                icon = 'Music';
            } else if (title.includes('CANVA') || title.includes('OFFICE') || title.includes('PICSART')) {
                category = 'Productivity';
                icon = 'Palette';
            } else if (title.includes('GEMINI') || title.includes('GROK') || title.includes('GPT') || title.includes('LEONARDO')) {
                category = 'AI Tools';
                icon = 'BrainCircuit';
            } else if (title.includes('CAPCUT') || title.includes('WINK') || title.includes('ALIGHT')) {
                category = 'Editing';
                icon = 'Video';
            } else if (title.includes('YOUTUBE') || title.includes('YT')) {
                category = 'Streaming';
                icon = 'Youtube';
            }

            // Calculate dynamic price ranges for variations
            let priceMin = p.price || 0;
            let priceMax = p.price || 0;

            if (p.is_variation && p.variations && p.variations.length > 0) {
                const prices = p.variations.map(v => v.price).filter(pr => pr > 0);
                if (prices.length > 0) {
                    priceMin = Math.min(...prices);
                    priceMax = Math.max(...prices);
                }
            }

            const displayPrice = priceMin !== priceMax 
                ? `Rp ${priceMin.toLocaleString('id-ID')} - Rp ${priceMax.toLocaleString('id-ID')}`
                : `Rp ${priceMin.toLocaleString('id-ID')}`;

            const globalVal = globalData[p.id] || {};

            return {
                id: String(p.id),
                name: p.title,
                code: p.code,
                stock: globalVal.stock !== undefined ? globalVal.stock : (p.stock || 0),
                sold: globalVal.sold !== undefined ? globalVal.sold : (p.sold || 0),
                imageUrl: globalVal.imageUrl || null,
                description: p.description || 'Layanan premium otomatis berkualitas.',
                category,
                icon,
                price_min: priceMin,
                price_max: priceMax,
                displayPrice,
                is_variation: p.is_variation,
                variations: (p.variations || []).map(v => {
                    const globalVarVal = globalData[v.id] || {};
                    return { 
                        ...v, 
                        sold: globalVarVal.sold !== undefined ? globalVarVal.sold : (v.sold || 0),
                        stock: globalVarVal.stock !== undefined ? globalVarVal.stock : (v.stock || 0)
                    };
                })
            };
        });

        // Bulk ambil cache + in-memory cache (N+1 → 1 query)
        const ids = transformedProducts.map(p => p.id);
        const cachedMap = await getCachedProducts(ids);
        const now = Date.now();
        const productsWithImages = await Promise.all(transformedProducts.map(async (p) => {
            // Cek in-memory cache dulu (super cepat)
            const memCached = productCache.get(p.id);
            if (memCached && (now - memCached._ts < CACHE_TTL)) {
                return memCached;
            }
            // Lalu SQLite cache
            const cached = cachedMap.get(p.id);
            
            // Tentukan imageUrl & snk secara instan tanpa fetch HTTP detail di loop list
            const imageUrl = p.imageUrl || (cached && cached.imageUrl) || getImageUrlForProduct(p.name);
            const snk = (cached && cached.snk) || 'Tidak ada syarat dan ketentuan.';
            
            if (!cached || cached.imageUrl !== imageUrl) {
                await cacheProduct({ ...p, snk }, imageUrl);
            }
            
            const result = { ...p, imageUrl, snk };
            productCache.set(p.id, { ...result, _ts: now });
            return result;
        }));

        res.json({ data: productsWithImages });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/xoftware/product-detail/:productId', async (req, res) => {
    const { productId } = req.params;
    const CACHE_TTL = 30 * 60 * 1000; // 30 menit cache validity

    try {
        // 1. Coba ambil dari cache
        const cached = await getCachedProduct(productId);
        if (cached && (Date.now() - cached.updatedAt < CACHE_TTL) && cached.imageUrl && cached.snk) {
            return res.json({
                ...cached,
                is_variation: cached.is_variation === 1,
                variations: JSON.parse(cached.variations || '[]')
            });
        }

        // 2. Jika tidak ada di cache atau expired, ambil list terbaru dari Xoftware
        const response = await axios.get(`${XOFTWARE_API_BASE_URL}/product`, { headers: xoftHeaders });
        const rawProduct = response.data.data.find(p => String(p.id) === String(productId) || p.code === productId);

        if (!rawProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Transform data produk yang ditemukan
        const title = (rawProduct.title || '').toUpperCase();
        let category = 'Streaming';
        let icon = 'Tv';

        if (title.includes('SPOTIFY') || title.includes('MUSIC')) {
            category = 'Music';
            icon = 'Music';
        } else if (title.includes('CANVA') || title.includes('OFFICE') || title.includes('PICSART')) {
            category = 'Productivity';
            icon = 'Palette';
        } else if (title.includes('GEMINI') || title.includes('GROK') || title.includes('GPT') || title.includes('LEONARDO')) {
            category = 'AI Tools';
            icon = 'BrainCircuit';
        } else if (title.includes('CAPCUT') || title.includes('WINK') || title.includes('ALIGHT')) {
            category = 'Editing';
            icon = 'Video';
        } else if (title.includes('YOUTUBE') || title.includes('YT')) {
            category = 'Streaming';
            icon = 'Youtube';
        }

        let priceMin = rawProduct.price || 0;
        let priceMax = rawProduct.price || 0;

        if (rawProduct.is_variation && rawProduct.variations && rawProduct.variations.length > 0) {
            const prices = rawProduct.variations.map(v => v.price).filter(pr => pr > 0);
            if (prices.length > 0) {
                priceMin = Math.min(...prices);
                priceMax = Math.max(...prices);
            }
        }

        const displayPrice = priceMin !== priceMax 
            ? `Rp ${priceMin.toLocaleString('id-ID')} - Rp ${priceMax.toLocaleString('id-ID')}`
            : `Rp ${priceMin.toLocaleString('id-ID')}`;

        const product = {
            id: String(rawProduct.id),
            name: rawProduct.title,
            code: rawProduct.code,
            stock: rawProduct.stock || 0,
            description: rawProduct.description || 'Layanan premium otomatis berkualitas.',
            category,
            icon,
            price_min: priceMin,
            price_max: priceMax,
            displayPrice,
            is_variation: rawProduct.is_variation,
            variations: rawProduct.variations || []
        };

        // Fetch real image & SNK from Xoftware API via background proxy
        const realDetail = await fetchRealProductDetailFromXoftware(product.id);
        const imageUrl = realDetail && realDetail.imageUrl ? realDetail.imageUrl : (cached ? cached.imageUrl : getImageUrlForProduct(product.name));
        const snk = realDetail && realDetail.snk ? realDetail.snk : (cached && cached.snk ? cached.snk : 'Tidak ada syarat dan ketentuan.');

        // Simpan ke cache
        await cacheProduct({ ...product, snk }, imageUrl);

        res.json({ ...product, imageUrl, snk });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/xoftware/register', async (req, res) => {
    try {
        // payload: { sender: no_hp, name: username }
        const { sender, name } = req.body;
        const response = await axios.post(`${XOFTWARE_API_BASE_URL}/register`, { sender, name }, { headers: xoftHeaders, proxy: false });
        res.json(response.data);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/xoftware/pay', async (req, res) => {
    try {
        const { sender, code, quantity, target } = req.body;
        // Cari user berdasarkan no phone atau username
        db.get('SELECT * FROM users WHERE phone = ? OR username = ?', [sender, sender], async (err, user) => {
            if (err || !user) return res.status(400).json({ error: 'User not found' });
            
            // Panggil API Xoftware untuk order/balance
            try {
                console.log('Mencoba order ke Xoftware API dengan payload:', JSON.stringify({
                    sender: '6726742120',
                    code,
                    quantity: Number(quantity || 1)
                }));
                const response = await axios.post(`${XOFTWARE_API_BASE_URL}/order/balance`, {
                    sender: '6726742120',
                    code,
                    quantity: Number(quantity || 1)
                }, { headers: xoftHeaders });
                
                console.log('XOFTWARE ORDER RAW:', JSON.stringify(response.data));
                
                if (response.data && (response.data.status || response.data.code === 200)) {
                    const orderData = response.data.data;
                    const totalPrice = Number(orderData.total_price || 0);
                    
                    // Cek saldo user lokal apakah cukup
                    if (user.balance < totalPrice) {
                        return res.status(400).json({ error: 'Saldo lokal Anda tidak mencukupi untuk memproses pesanan ini.' });
                    }
                    
                    // Kurangi saldo user lokal
                    db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalPrice, user.id], (upErr) => {
                        if (upErr) console.error('Failed to deduct balance:', upErr);
                    });
                    
                    // Kirim detail akun ke email
                    const accounts = Array.isArray(orderData.accounts) 
                        ? orderData.accounts.map(acc => Object.entries(acc).map(([k, v]) => `${k}: ${v}`).join('\n')).join('\n\n')
                        : JSON.stringify(orderData.accounts || orderData);
                    
                    const emailTujuan = target || user.email;
                    console.log(`Mengirim kredensial ke email: ${emailTujuan}`);
                    resend.emails.send({
                        from: 'Vitalwounds <noreply@vitalwounds.my.id>',
                        to: emailTujuan,
                        subject: `Detail Pembelian ${orderData.title || 'Produk Premium'}`,
                        text: `Pembelian Berhasil!\n\nDetail akun:\n${accounts}`
                    }).then(r => console.log('Email terkirim:', r)).catch(err => console.error('Email send failed:', err));

                    res.json(response.data);
                } else {
                    res.status(400).json({ error: response.data.message || 'Gagal memproses order ke supplier.' });
                }
            } catch (axErr) {
                console.error(`Failed to process Xoftware order:`, axErr.response ? axErr.response.data : axErr.message);
                res.status(502).json({ error: axErr.response ? axErr.response.data.message : 'Xoftware API error' });
            }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/xoftware/deposit-qris', async (req, res) => {
    try {
        if (!req.body) return res.status(400).json({ error: 'Body tidak ditemukan' });
        const { amount, payment_method, user_id } = req.body;
        
        db.get('SELECT username FROM users WHERE username = ?', [user_id], async (err, user) => {
            if (err || !user) return res.status(400).json({ error: 'User tidak ditemukan' });
            try {
                const response = await axios.post(`${XOFTWARE_API_BASE_URL}/deposit`, {
                    amount: Number(amount),
                    sender: '6726742120'
                }, { headers: xoftHeaders });
                
                const result = response.data.data || response.data;
                const txId = result.transaction_id || result.id || '';
                
        if (txId) {
                    const depId = `DEP-${Math.floor(1000 + Math.random() * 9000)}`;
                    db.run(
                        'INSERT OR IGNORE INTO deposits (id, username, amount, status, transactionId, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [depId, user_id, Number(amount), 'pending', String(txId), Date.now()]
                    );
                    // Return txId ke FE supaya bisa redirect
                    res.json({ ...result, txId: String(txId) });
                } else {
                    res.json(result);
                }
            } catch (axErr) {
                const errMsg = axErr?.response?.data?.message || axErr?.message || 'Xoftware API error';
                console.error(`Failed to create Xoftware deposit: ${errMsg}`);
                res.status(502).json({ error: errMsg });
            }
        });
    } catch (error) { 
        console.error('Deposit endpoint error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan internal pada server' }); 
    }
});

app.get('/api/xoftware/deposit-status', async (req, res) => {
    try {
        const { transactionId } = req.query;
        if (!transactionId) return res.status(400).json({ error: 'transactionId query parameter is required' });
        
        const response = await axios.get(`${XOFTWARE_API_BASE_URL}/order/status?transaction_id=${transactionId}`, { headers: xoftHeaders });
        const xoftData = response.data.data || response.data;
        
        // Status dari Xoftware: 'success', 'pending', 'fail'
        const xoftStatus = (xoftData.status || '').toLowerCase();
        
        if (xoftStatus === 'success' || xoftStatus === 'paid') {
            // Cek di DB lokal apakah deposit ini masih pending
            db.get('SELECT * FROM deposits WHERE transactionId = ?', [transactionId], (err, dep) => {
                if (dep && dep.status === 'pending') {
                    // Update status deposit jadi success
                    db.run('UPDATE deposits SET status = ? WHERE transactionId = ?', ['success', transactionId], (uErr) => {
                        if (!uErr) {
                            // Tambah saldo user
                            db.run(
                                'UPDATE users SET balance = balance + ? WHERE username = ?',
                                [dep.amount, dep.username],
                                (balErr) => {
                                    if (balErr) console.error('Failed to update user balance on deposit success:', balErr);
                                    else console.log(`Successfully credited ${dep.amount} to ${dep.username}`);
                                }
                            );
                        }
                    });
                }
            });
        }
        
        res.json(response.data);
    } catch (error) {
        console.error(`Failed to get Xoftware deposit status: ${error?.response?.data?.message || error?.message}`);
        res.status(502).json({ error: error?.response?.data?.message || error?.message || 'Xoftware API error' });
    }
});

// OTP: send code to email
app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Check if email already registered
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
        if (user) return res.status(400).json({ error: 'Email sudah terdaftar' });

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiredAt = Date.now() + 5 * 60 * 1000; // 5 menit

        db.run('INSERT INTO otp_codes (email, otp, expiredAt) VALUES (?, ?, ?)', [email, otp, expiredAt], async (err) => {
            if (err) return res.status(500).json({ error: 'Gagal simpan OTP' });

            try {
                const result = await resend.emails.send({
                    from: 'Vitalwounds <noreply@vitalwounds.my.id>',
                    to: email,
                    subject: 'Kode OTP Registrasi Vitalwounds',
                    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                        <h2 style="color:#1e3a5f">Verifikasi Email</h2>
                        <p>Gunakan kode OTP berikut untuk melanjutkan registrasi:</p>
                        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f0f4ff;border-radius:8px;color:#1d4ed8">${otp}</div>
                        <p style="color:#666;font-size:13px">Kode berlaku 5 menit.</p>
                        <p style="color:#999;font-size:12px">Abaikan jika tidak meminta.</p>
                    </div>`
                });
                console.log('RESEND OK:', JSON.stringify(result));
                res.json({ message: 'OTP terkirim' });
            } catch (e) {
                console.error('RESEND ERROR:', e?.message || e);
                // OTP tetap ada di DB untuk debugging — bisa dicek di server
                res.status(500).json({ error: 'Gagal kirim email. Coba lagi.' });
            }
        });
    });
});

// OTP: verify code
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email & OTP required' });

    db.get('SELECT * FROM otp_codes WHERE email = ? AND otp = ? AND verified = 0 ORDER BY id DESC LIMIT 1', [email, otp], (err, row) => {
        if (err || !row) return res.status(400).json({ error: 'Kode OTP salah atau sudah expired' });
        if (Date.now() > row.expiredAt) return res.status(400).json({ error: 'Kode OTP sudah expired' });

        db.run('UPDATE otp_codes SET verified = 1 WHERE id = ?', [row.id]);
        res.json({ message: 'OTP valid' });
    });
});

// Existing routes (unchanged for now)
app.post('/api/register', async (req, res) => {
    const { username, email, password, phone } = req.body;

    // Wajib verifikasi OTP dulu
    db.get('SELECT verified FROM otp_codes WHERE email = ? ORDER BY id DESC LIMIT 1', [email], (err, row) => {
        if (err || !row || !row.verified) return res.status(400).json({ error: 'Verifikasi email dengan OTP terlebih dahulu' });

        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, phone], async (err) => {
            if (err) return res.status(400).json({ error: 'Username/Email sudah terdaftar' });
            // Daftar ke Xoftware ecosystem
            try {
                await axios.post(`${XOFTWARE_API_BASE_URL}/register`, { sender: phone, name: username }, { headers: xoftHeaders, proxy: false });
                console.log('XOFTWARE REGISTER OK:', username, phone);
            } catch (xe) {
                // Jangan block registrasi lokal — Xoftware mungkin beda validasi
                console.error('XOFTWARE REGISTER FAIL:', xe?.response?.data || xe?.message);
            }
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
                res.json({ message: 'User registered', user });
            });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Cari berdasarkan username ATAU email
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful', user: { username: user.username, balance: user.balance, email: user.email, phone: user.phone } });
    });
});

app.get('/api/users/:username', (req, res) => {
    const { username } = req.params;
    db.get('SELECT id, username, email, balance, phone FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    });
});

app.get('/pay/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    db.get('SELECT * FROM deposits WHERE transactionId = ?', [transactionId], async (err, dep) => {
        if (err || !dep) return res.status(404).send('<h1>Transaksi Tidak Ditemukan</h1>');
        try {
            const response = await axios.get(`${XOFTWARE_API_BASE_URL}/order/status?transaction_id=${transactionId}`, { headers: xoftHeaders });
            const xoftData = response.data.data || response.data;
            const qrString = xoftData.qr_string || '';
            const amount = dep.amount;
            const status = xoftData.status || 'pending';
            
            res.send(`
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Pembayaran QRIS - Vitalwounds</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
                <div class="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full text-center">
                    <div class="flex justify-center mb-2">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold">VW</div>
                    </div>
                    <h2 class="text-xl font-bold text-gray-800 mb-1">Pembayaran QRIS</h2>
                    <p class="text-gray-500 text-xs mb-4">Scan QRIS di bawah untuk menyelesaikan pembayaran</p>
                    
                    <div class="flex justify-center mb-4 bg-white p-3 border rounded-xl">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=250x250" alt="QR Code" class="w-64 h-64">
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded-xl mb-4 text-left text-xs space-y-2">
                        <div class="flex justify-between text-gray-600">
                            <span>ID Transaksi</span>
                            <span class="font-mono font-semibold">${transactionId}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>Total Bayar</span>
                            <span class="font-bold text-blue-600 text-sm">Rp ${Number(amount).toLocaleString('id-ID')}</span>
                        </div>
                        <div class="flex justify-between text-gray-600">
                            <span>Status</span>
                            <span class="capitalize font-semibold text-yellow-600">${status}</span>
                        </div>
                    </div>
                    
                    <button onclick="checkPayment()" id="check-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 text-sm">
                        Cek Status Pembayaran
                    </button>
                    
                    <a href="/dashboard" class="block text-gray-400 text-xs mt-4 hover:text-gray-600">Kembali ke Dashboard</a>
                </div>

                <script>
                    async function checkPayment() {
                        const btn = document.getElementById('check-btn');
                        btn.disabled = true;
                        btn.innerText = 'Memeriksa...';
                        
                        try {
                            const res = await fetch('/api/xoftware/deposit-status?transactionId=${transactionId}');
                            const data = await res.json();
                            const status = (data.data?.status || data.status || '').toLowerCase();
                            
                            if (status === 'success' || status === 'paid') {
                                alert('Pembayaran Berhasil! Saldo Anda telah bertambah.');
                                window.location.href = '/dashboard';
                            } else {
                                alert('Pembayaran belum diterima. Silakan selesaikan pembayaran terlebih dahulu.');
                            }
                        } catch (e) {
                            alert('Gagal memeriksa status pembayaran.');
                        } finally {
                            btn.disabled = false;
                            btn.innerText = 'Cek Status Pembayaran';
                        }
                    }
                </script>
            </body>
            </html>
            `);
        } catch (e) {
            res.status(500).send('<h1>Gagal memuat detail pembayaran. Coba lagi nanti.</h1>');
        }
    });
});

app.listen(6768, () => console.log('API running on port 6768'));
