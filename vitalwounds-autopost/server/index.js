import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import db from './db.js';
import { encryptToken, decryptToken, validateToken, fetchGuilds, fetchChannels, getUploadDir } from './engine.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '18690', 10);
const PIN = process.env.AUTOPOST_PIN || 'vitalwounds';
const AUTH_SECRET = process.env.AUTH_SECRET || (fs.existsSync(path.join(__dirname, '..', 'data', '.authsecret')) ? fs.readFileSync(path.join(__dirname, '..', 'data', '.authsecret'), 'utf8').trim() : (() => {
  const s = crypto.randomBytes(32).toString('hex');
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'data', '.authsecret'), s, { mode: 0o600 });
  return s;
})());

const app = express();
app.use(express.json({ limit: '5mb' }));

// ─── Auth (PIN → HMAC cookie stateless) ─────────────────────────────
const COOKIE_NAME = 'ap_auth';
function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}
function verify(cookie) {
  if (!cookie) return null;
  const [data, sig] = String(cookie).split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  if (sig !== expected) return null;
  const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  if (payload.exp < Date.now()) return null;
  return payload;
}
function requireAuth(req, res, next) {
  if (!verify(req.cookies?.[COOKIE_NAME])) {
    return res.status(401).json({ error: 'Unauthorized — silakan masukkan PIN.' });
  }
  next();
}
// cookie parser minimal
app.use((req, res, next) => {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) req.cookies[k] = decodeURIComponent(v.join('='));
  }
  next();
});

// Rate limit sederhana untuk brute-force PIN
const loginAttempts = new Map(); // ip → { count, firstAt }
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 10 * 60 * 1000;

app.post('/api/auth', (req, res) => {
  // Hanya percaya X-Forwarded-For jika peer langsung adalah nginx (localhost).
  // Akses langsung ke port 90 / NAT tidak lewat nginx → tetap pakai IP asli (anti-spoof).
  const peer = req.socket.remoteAddress || 'unknown';
  const isTrustedProxy = peer === '127.0.0.1' || peer === '::1' || peer === '::ffff:127.0.0.1';
  const parts = isTrustedProxy
    ? String(req.headers['x-forwarded-for'] || '').split(',').map(s => s.trim()).filter(Boolean)
    : [];
  // Nilai TERAKHIR dari XFF = IP asli yang ditambahkan nginx ($proxy_add_x_forwarded_for),
  // nilai sebelumnya bisa dipalsukan klien.
  const ip = parts.length ? parts[parts.length - 1] : peer;
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (rec && now - rec.firstAt > ATTEMPT_WINDOW) loginAttempts.delete(ip);
  if (rec && now - rec.firstAt <= ATTEMPT_WINDOW && rec.count >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.' });
  }

  const { pin } = req.body || {};
  if (String(pin || '') !== PIN) {
    if (!rec) loginAttempts.set(ip, { count: 1, firstAt: now });
    else rec.count++;
    return res.status(401).json({ error: 'PIN salah.' });
  }
  loginAttempts.delete(ip);
  const token = sign({ exp: Date.now() + 30 * 24 * 3600 * 1000 });
  // Secure hanya saat lewat HTTPS (proxy/Cloudflare), agar testing lokal HTTP tetap jalan.
  const secure = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${30 * 24 * 3600}`);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.json({ ok: true });
});

// ─── SSO dari vitalwounds.my.id (autopost.vitalwounds.my.id/api/sso?token=...) ──
// Main app (server.js) menandatangani token { email, sub_end, iat, exp, jti } dengan
// AUTOPOST_SSO_SECRET lalu redirect ke sini. Verifikasi KETAT:
//   • signature HMAC-SHA256 dibanding constant-time (timingSafeEqual)
//   • token hanya valid 5 menit (exp = iat + 5m, bukan batas subscription)
//   • jti nonce → anti-replay (token bekas ditolak)
// Setelah lolos, issue cookie `ap_auth` (ditandatangani AUTH_SECRET lokal) yang
// sama dengan login PIN, sehingga dashboard langsung terbuka tanpa PIN.
const SSO_SECRET = process.env.AUTOPOST_SSO_SECRET;
const SSO_TOKEN_TTL_MS = 5 * 60 * 1000;      // masa berlaku token SSO (5 menit)
const SSO_COOKIE_MAX_MS = 30 * 24 * 3600 * 1000; // cookie dashboard maks 30 hari
const usedSsoJti = new Map();                 // jti → exp (anti-replay; in-memory per-proses — aplikasi berjalan single fork pm2)

// Prune berkala (60s) agar jalur request tetap O(1) dan Map tidak membengkak.
setInterval(() => {
  const now = Date.now();
  for (const [jti, exp] of usedSsoJti) if (exp < now) usedSsoJti.delete(jti);
}, 60 * 1000).unref?.();

function verifySsoToken(token) {
  if (!SSO_SECRET) return { ok: false, error: 'Sesi tidak valid. Silakan buka kembali dari Vitalwounds.' };
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return { ok: false, error: 'Sesi tidak valid. Silakan buka kembali dari Vitalwounds.' };
  const expected = crypto.createHmac('sha256', SSO_SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, error: 'Sesi tidak valid. Silakan buka kembali dari Vitalwounds.' };
  let payload;
  try { payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')); }
  catch { return { ok: false, error: 'Sesi tidak valid. Silakan buka kembali dari Vitalwounds.' }; }
  const now = Date.now();
  if (!payload || typeof payload.exp !== 'number' || payload.exp < now) return { ok: false, error: 'Sesi kedaluwarsa. Silakan buka kembali dari Vitalwounds.' };
  // Defense-in-depth: tolak token yang mengklaim berlaku lebih lama dari TTL (5 menit)
  if (payload.exp > now + SSO_TOKEN_TTL_MS) return { ok: false, error: 'Sesi tidak valid. Silakan buka kembali dari Vitalwounds.' };
  if (!payload.jti) return { ok: false, error: 'Sesi tidak valid. Silakan buka kembali dari Vitalwounds.' };
  if (usedSsoJti.has(payload.jti)) return { ok: false, error: 'Sesi sudah dipakai. Silakan buka kembali dari Vitalwounds.' };
  usedSsoJti.set(payload.jti, payload.exp);
  return { ok: true, payload };
}

app.get('/api/sso', (req, res) => {
  const result = verifySsoToken(req.query.token);
  if (!result.ok) {
    // log detail kegagalan untuk debugging (tanpa token)
    console.error('[SSO] rejected:', result.error);
    return res.redirect(`/?sso_error=${encodeURIComponent(result.error)}`);
  }
  const { email, sub_end } = result.payload;
  const now = Date.now();
  let cookieExp = now + SSO_COOKIE_MAX_MS;
  if (typeof sub_end === 'number' && sub_end > now) {
    cookieExp = Math.min(cookieExp, sub_end);
  }
  if (cookieExp <= now) {
    return res.redirect(`/?sso_error=${encodeURIComponent('Subscription sudah berakhir.')}`);
  }
  const signed = sign({ email: email || '', exp: cookieExp });
  const secure = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${signed}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${Math.floor((cookieExp - now) / 1000)}`);
  res.redirect('/');
});

// ─── Status ─────────────────────────────────────────────────────────
app.get('/api/status', (req, res) => {
  const authed = !!verify(req.cookies?.[COOKIE_NAME]);
  const accounts = db.listTokens().map(t => ({ discord_id: t.discord_id, username: t.username, avatar: t.avatar, created_at: t.created_at }));
  const account = accounts[0] || null;
  res.json({ authed, account, accounts });
});

// ─── Account / Connect ──────────────────────────────────────────────
app.post('/api/connect', requireAuth, async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!token) return res.status(400).json({ error: 'Token wajib diisi.' });
  const check = await validateToken(token);
  if (!check.valid) return res.status(400).json({ error: `Token tidak valid: ${check.error}` });

  const user = check.user;
  const discordId = String(user.id);
  const encrypted = encryptToken(token);
  db.saveToken(discordId, encrypted, user.username || user.global_name || `user_${discordId.slice(-4)}`, user.avatar || null, Date.now());

  // scrape guilds
  const guilds = await fetchGuilds(token);
  if (guilds) for (const g of guilds) db.upsertGuild(g);

  res.json({ ok: true, account: { discord_id: discordId, username: user.username, avatar: user.avatar }, guilds: guilds ? guilds.length : 0 });
});

app.get('/api/accounts', requireAuth, (req, res) => {
  res.json(db.listTokens().map(t => ({ discord_id: t.discord_id, username: t.username, avatar: t.avatar, created_at: t.created_at })));
});

app.delete('/api/accounts/:discordId', requireAuth, (req, res) => {
  db.deleteToken(req.params.discordId);
  res.json({ ok: true });
});

// decryptToken bisa throw (ciphertext korup) — bungkus agar async handler tidak hang
function decryptOrNull(tokenData) {
  try { return decryptToken(tokenData.encrypted_token); } catch { return null; }
}

// ─── Guilds & Channels (scrape via token) ───────────────────────────
app.get('/api/guilds', requireAuth, async (req, res) => {
  const account = req.query.account;
  const tokenData = account ? db.getToken(account) : db.getPrimaryToken();
  if (!tokenData) return res.json({ guilds: [] });
  let guilds = db.listGuilds();
  if (guilds.length === 0) {
    const token = decryptOrNull(tokenData);
    if (!token) return res.status(500).json({ error: 'Gagal mendekripsi token.' });
    const scraped = await fetchGuilds(token);
    if (scraped) {
      for (const g of scraped) db.upsertGuild(g);
      guilds = db.listGuilds();
    }
  }
  res.json({ guilds: guilds.map(g => ({ id: g.guild_id, name: g.name, icon: g.icon })) });
});

app.post('/api/guilds/refresh', requireAuth, async (req, res) => {
  const tokenData = db.getPrimaryToken();
  if (!tokenData) return res.status(400).json({ error: 'Tidak ada akun terhubung.' });
  const token = decryptOrNull(tokenData);
  if (!token) return res.status(500).json({ error: 'Gagal mendekripsi token.' });
  const scraped = await fetchGuilds(token);
  if (!scraped) return res.status(400).json({ error: 'Gagal scrape guilds — cek token.' });
  for (const g of scraped) db.upsertGuild(g);
  res.json({ ok: true, count: scraped.length });
});

app.get('/api/channels', requireAuth, async (req, res) => {
  const { guildId, account } = req.query;
  if (!guildId) return res.status(400).json({ error: 'guildId wajib.' });
  const tokenData = account ? db.getToken(account) : db.getPrimaryToken();
  if (!tokenData) return res.status(400).json({ error: 'Tidak ada akun terhubung.' });
  const token = decryptOrNull(tokenData);
  if (!token) return res.status(500).json({ error: 'Gagal mendekripsi token.' });
  const channels = await fetchChannels(token, String(guildId));
  if (!channels) return res.status(400).json({ error: 'Gagal scrape channel (token tidak valid / tidak punya akses server).' });
  for (const c of channels) db.upsertChannel({ ...c, guildId: String(guildId) });
  res.json({ channels: db.listChannels(String(guildId)).map(c => ({ id: c.channel_id, name: c.name, rate_limit_per_user: c.rate_limit_per_user })) });
});

// ─── Missions ───────────────────────────────────────────────────────
function enrichMission(m) {
  const schedules = db.listSchedules(m.id);
  const nextRunAt = schedules.length ? Math.min(...schedules.map(s => s.next_run)) : null;
  return {
    ...m,
    channelsDetail: schedules.map(s => ({
      channel_id: s.channel_id, name: s.channel_name, next_run: s.next_run,
      rate_limit_per_user: s.rate_limit_per_user,
    })),
    next_run_at: nextRunAt,
  };
}

app.get('/api/missions', requireAuth, (req, res) => {
  const { account } = req.query;
  const missions = (account ? db.listMissions(String(account)) : db.listMissions()).map(enrichMission);
  const accounts = db.listTokens().map(t => ({ discord_id: t.discord_id, username: t.username }));
  res.json({ missions, accounts });
});

app.post('/api/missions', requireAuth, (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const channels = Array.isArray(b.channels) ? b.channels.map(String).filter(Boolean) : [];
  if (!name) return res.status(400).json({ error: 'Nama misi wajib diisi.' });
  if (channels.length === 0) return res.status(400).json({ error: 'Pilih minimal 1 channel.' });

  const tokenData = db.getPrimaryToken();
  if (!tokenData) return res.status(400).json({ error: 'Hubungkan token Discord dulu.' });

  const rawInt = parseInt(b.intervalMinutes, 10);
  const intervalMinutes = Number.isNaN(rawInt) ? 0 : rawInt; // 0 = Auto (slowmode)
  const data = {
    name,
    message: String(b.message || ''),
    channels,
    filePaths: b.filePaths || null,
    fileNames: b.fileNames || null,
    intervalMinutes,
    customIntervals: b.customIntervals || null,
  };

  // UPSERT: id yang dikirim frontend (bisa draft client-side) yang tidak ada di DB → buat baru.
  // Sebelumnya ini 404 "Misi tidak ditemukan" sehingga misi baru tidak pernah bisa disimpan.
  const id = String(b.id || '').trim() || (Math.random().toString(36).substring(2, 8) + Date.now().toString(36));
  const existing = db.getMission(id);
  if (existing) {
    db.updateMission(id, data);
    if (existing.status === 'running') db.resetSchedules(id);
  } else {
    const status = b.status === 'running' ? 'running' : 'paused';
    db.createMission({ id, discordId: tokenData.discord_id, ...data, status, createdAt: Date.now() });
  }
  res.json({ ok: true, mission: enrichMission(db.getMission(id)) });
});

app.post('/api/missions/:id/toggle', requireAuth, (req, res) => {
  const mission = db.getMission(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Misi tidak ditemukan.' });
  const next = mission.status === 'running' ? 'paused' : 'running';
  db.setMissionStatus(mission.id, next);
  if (next === 'running') db.resetSchedules(mission.id);
  res.json({ ok: true, status: next });
});

app.post('/api/missions/:id/reset', requireAuth, (req, res) => {
  const mission = db.getMission(req.params.id);
  if (!mission) return res.status(404).json({ error: 'Misi tidak ditemukan.' });
  db.resetSchedules(mission.id);
  res.json({ ok: true });
});

app.delete('/api/missions/:id', requireAuth, (req, res) => {
  if (!db.getMission(req.params.id)) return res.status(404).json({ error: 'Misi tidak ditemukan.' });
  db.deleteMission(req.params.id);
  res.json({ ok: true });
});

// ─── Logs & Stats ───────────────────────────────────────────────────
app.get('/api/logs', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const missionId = req.query.missionId || null;
  res.json(db.listLogs(limit, missionId));
});

app.get('/api/stats', requireAuth, (req, res) => {
  const missions = db.listMissions();
  const logs = db.logCounts();
  res.json({
    missions: missions.length,
    running: missions.filter(m => m.status === 'running').length,
    paused: missions.filter(m => m.status === 'paused').length,
    logs,
    accounts: db.listTokens().length,
  });
});

// ─── Webhooks ───────────────────────────────────────────────────────
app.get('/api/webhooks', requireAuth, (req, res) => {
  const tokenData = db.getPrimaryToken();
  if (!tokenData) return res.json({ webhooks: [] });
  res.json({ webhooks: db.listWebhooks(tokenData.discord_id) });
});

app.post('/api/webhooks', requireAuth, (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  const url = String(b.url || '').trim();
  if (!name || !url) return res.status(400).json({ error: 'Nama & URL webhook wajib diisi.' });
  if (!/^https:\/\/discord\.com\/api\/webhooks\//.test(url)) return res.status(400).json({ error: 'URL webhook Discord tidak valid.' });
  const tokenData = db.getPrimaryToken();
  if (!tokenData) return res.status(400).json({ error: 'Tidak ada akun terhubung.' });
  db.saveWebhook(tokenData.discord_id, name, url);
  res.json({ ok: true, webhooks: db.listWebhooks(tokenData.discord_id) });
});

app.delete('/api/webhooks/:id', requireAuth, (req, res) => {
  db.deleteWebhook(parseInt(req.params.id, 10));
  res.json({ ok: true });
});

// ─── Upload (lampiran misi) ─────────────────────────────────────────
const MIME_EXT = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
  'application/pdf': '.pdf', 'text/plain': '.txt', 'audio/mpeg': '.mp3', 'application/zip': '.zip',
};
const SAFE_MIME = new Set(Object.keys(MIME_EXT));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, getUploadDir()),
    filename: (req, file, cb) => {
      // Ekstensi diturunkan dari mimetype (server-side), bukan dari nama asli —
      // mencegah file .html/.svg berbahaya diserve dengan content-type yang bisa eksekusi.
      const ext = MIME_EXT[file.mimetype] || '.bin';
      cb(null, `${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (SAFE_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('Tipe file tidak diizinkan (hanya gambar/video/pdf/txt/audio/zip).'));
  },
});



app.post('/api/upload', requireAuth, upload.array('files', 10), (req, res) => {
  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: 'Tidak ada file.' });
  res.json({
    success: true,
    paths: files.map(f => `/uploads/${f.filename}`),
    names: files.map(f => f.originalname),
  });
});

app.use('/uploads', express.static(getUploadDir()));

// ─── Static Frontend ────────────────────────────────────────────────
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Error handler → selalu JSON (bukan HTML 500 default Express).
// WAJIB paling akhir: Express mencari error-handler SETELAH titik error.
app.use((err, req, res, next) => {
  if (err) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.message || 'Terjadi kesalahan.' });
  }
  next();
});

// ─── Start ──────────────────────────────────────────────────────────
startScheduler();

app.listen(PORT, () => {
  console.log(`==============================================`);
  console.log(`  💠 VITALWOUNDS AUTOPOST`);
  console.log(`  ➜ http://localhost:${PORT}`);
  console.log(`  ➜ PIN akses: ${PIN}  (ubah via env AUTOPOST_PIN)`);
  console.log(`==============================================`);
});
