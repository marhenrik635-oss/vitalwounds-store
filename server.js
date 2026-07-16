import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import http from 'http';
import https from 'https';
import session from 'express-session';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

// Autopost DB loader (local SQLite via @libsql/client)
let autopostClient = null;
function getAutopostClient() {
  if (autopostClient) return autopostClient;
  const { createClient } = _require('@libsql/client');
  const dbPath = process.env.AUTOPOST_DB_PATH 
    ? resolve(process.env.AUTOPOST_DB_PATH)
    : resolve(__dirname, '..', 'bot-zyo', 'data', 'autopost.db');
  
  // Normalize path to forward slashes for file: protocol
  const normalizedPath = dbPath.split('\\').join('/');
  autopostClient = createClient({ url: 'file:' + normalizedPath });
  console.log('[AUTOPOST] Using DB:', normalizedPath);
  return autopostClient;
}

function safeDb(sql, args = []) {
  return getAutopostClient().execute({ sql, args });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(compression());

app.use(session({
  secret: process.env.KINDE_CLIENT_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

const PORT = process.env.PORT || 3000;
const API_TARGET = process.env.API_TARGET || 'http://localhost:6768';

// --- Collect raw body helper ---
function rawBody(req, res, next) {
  req.rawBody = '';
  req.on('data', function(c) { req.rawBody += c; });
  req.on('end', next);
}

// ─── Autopost Subscription System ───────────────────────────────

// Access vitalwounds-api DB for balance/role operations
let vitalwoundsDb = null;
function getVitalwoundsDb() {
  if (vitalwoundsDb) return vitalwoundsDb;
  try {
    const { createClient } = _require('@libsql/client');
    const fs = _require('fs');
    const possiblePaths = [
      '/home/ubuntu/vitalwounds-api/database.db',
      resolve(__dirname, '..', 'vitalwounds-api', 'database.db'),
      resolve(process.cwd(), 'vitalwounds-api', 'database.db'),
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        vitalwoundsDb = createClient({ url: 'file:' + p.split('\\').join('/') });
        console.log('[AUTOPOST] Vitalwounds DB:', p);
        return vitalwoundsDb;
      }
    }
    console.warn('[AUTOPOST] Vitalwounds DB not found!');
  } catch (e) {
    console.error('[AUTOPOST] Vitalwounds DB init error:', e.message);
  }
  return null;
}

const SUBSCRIPTION_PLANS = {
  '1month':  { label: '1 Bulan', price: 10000, durationMs: 30 * 24 * 60 * 60 * 1000 },
  '3months': { label: '3 Bulan', price: 25000, durationMs: 90 * 24 * 60 * 60 * 1000 },
  '6months': { label: '6 Bulan', price: 45000, durationMs: 180 * 24 * 60 * 60 * 1000 },
  '1year':   { label: '1 Tahun', price: 90000, durationMs: 365 * 24 * 60 * 60 * 1000 },
  'lifetime':{ label: 'Seumur Hidup', price: 100000, durationMs: null },
};

// Ensure ap_subscriptions table exists
async function ensureSubscriptionsTable() {
  try {
    await safeDb(`CREATE TABLE IF NOT EXISTS ap_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT NOT NULL,
      email TEXT,
      plan TEXT NOT NULL,
      amount_paid INTEGER NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER,
      status TEXT DEFAULT 'active',
      authorized INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )`);
    console.log('[AUTOPOST] Subscriptions table ready');
  } catch (err) {
    console.error('[AUTOPOST] Failed to create subscriptions table:', err.message);
  }
}
ensureSubscriptionsTable();

// ─── Autopost API Routes (protected by Kinde auth) ───────────────

function isKindeAuthenticated(req) {
  return kindeClient && kindeClient.isAuthenticated(req);
}

async function getKindeUser(req) {
  if (!kindeClient) return null;
  try {
    const authed = await kindeClient.isAuthenticated(req);
    if (!authed) return null;
    return await kindeClient.getUserProfile(req);
  } catch { return null; }
}

// Helper: check if user has valid subscription + authorization
async function checkAutopostAccess(user) {
  const discordId = user.id || user.email;
  const email = user.email || '';
  
  // 1. Check role from vitalwounds DB
  let userRole = 'member';
  try {
    const vwDb = getVitalwoundsDb();
    if (vwDb) {
      const result = await vwDb.execute({
        sql: 'SELECT role FROM users WHERE email = ?',
        args: [email],
      });
      if (result.rows && result.rows.length > 0) {
        userRole = result.rows[0].role || 'member';
      }
    }
  } catch (dbErr) {
    console.error('[AUTOPOST] Role check error:', dbErr.message);
  }
  
  if (userRole !== 'admin' && userRole !== 'owner') {
    return { allowed: false, reason: 'role', userRole };
  }
  
  // 2. Check subscription
  const subResult = await safeDb(
    `SELECT * FROM ap_subscriptions WHERE discord_id = ? ORDER BY id DESC LIMIT 1`,
    [discordId]
  );
  
  if (subResult.rows && subResult.rows.length > 0) {
    const sub = subResult.rows[0];
    const isActive = sub.status === 'active';
    const isLifetime = sub.plan === 'lifetime';
    const notExpired = isLifetime || (sub.end_date && sub.end_date > Date.now());
    
    if (isActive && notExpired) {
      if (sub.authorized === 1) {
        return { allowed: true, userRole };
      }
      return { allowed: false, reason: 'unauthorized', userRole, subscription: sub };
    }
    
    // Auto-expire if past end_date
    if (isActive && !notExpired) {
      await safeDb('UPDATE ap_subscriptions SET status = ? WHERE id = ?', ['expired', sub.id]);
    }
  }
  
  return { allowed: false, reason: 'no_subscription', userRole };
}

// GET /api/autopost/subscription — check subscription status & role
app.get('/api/autopost/subscription', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const discordId = user.id || user.email;
    const email = user.email || '';
    
    // Get role and balance from vitalwounds DB
    let userRole = 'member';
    let userBalance = 0;
    let errorMsg = null;
    
    try {
      const vwDb = getVitalwoundsDb();
      if (vwDb) {
        const result = await vwDb.execute({
          sql: 'SELECT role, balance FROM users WHERE email = ?',
          args: [email],
        });
        if (result.rows && result.rows.length > 0) {
          userRole = result.rows[0].role || 'member';
          userBalance = result.rows[0].balance || 0;
        }
      }
    } catch (dbErr) {
      console.error('[AUTOPOST] DB error:', dbErr.message);
      errorMsg = 'Gagal memeriksa data user';
    }
    
    // Check subscription
    const subResult = await safeDb(
      `SELECT * FROM ap_subscriptions WHERE discord_id = ? AND (end_date IS NULL OR end_date > ?) ORDER BY id DESC LIMIT 1`,
      [discordId, Date.now()]
    );
    
    let subscription = null;
    let hasValidSubscription = false;
    
    if (subResult.rows && subResult.rows.length > 0) {
      const sub = subResult.rows[0];
      if (sub.status === 'active') {
        hasValidSubscription = true;
        subscription = {
          id: sub.id,
          plan: sub.plan,
          planLabel: (SUBSCRIPTION_PLANS[sub.plan] || {}).label || sub.plan,
          startDate: sub.start_date,
          endDate: sub.end_date,
          authorized: sub.authorized === 1,
          status: sub.status,
        };
      }
    }
    
    res.json({
      role: userRole,
      balance: userBalance,
      email: email,
      canAccess: userRole === 'admin' || userRole === 'owner',
      hasValidSubscription,
      subscription,
      plans: Object.fromEntries(
        Object.entries(SUBSCRIPTION_PLANS).map(([k, v]) => [k, { label: v.label, price: v.price }])
      ),
      error: errorMsg,
    });
  } catch (err) {
    console.error('[AUTOPOST] Subscription check error:', err.message);
    res.status(500).json({ error: 'Gagal memeriksa subscription' });
  }
});

// POST /api/autopost/subscribe — purchase a subscription plan
app.post('/api/autopost/subscribe', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const discordId = user.id || user.email;
    const email = user.email || '';
    const { plan } = req.body;
    
    // Validate plan
    const planConfig = SUBSCRIPTION_PLANS[plan];
    if (!planConfig) return res.status(400).json({ error: 'Paket tidak valid' });
    
    const amount = planConfig.price;
    
    // Get user from vitalwounds DB
    const vwDb = getVitalwoundsDb();
    if (!vwDb) return res.status(500).json({ error: 'Database tidak tersedia' });
    
    const vwResult = await vwDb.execute({
      sql: 'SELECT id, balance, role FROM users WHERE email = ?',
      args: [email],
    });
    
    if (!vwResult.rows || vwResult.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan. Silakan login ulang.' });
    }
    
    const userData = vwResult.rows[0];
    const userId = userData.id;
    const userBalance = userData.balance || 0;
    const userRole = userData.role || 'member';
    
    // Check if user can access autopost
    if (userRole !== 'admin' && userRole !== 'owner') {
      return res.status(403).json({ error: 'Fitur ini hanya untuk Admin & Owner' });
    }
    
    // Check balance
    if (userBalance < amount) {
      return res.status(400).json({
        error: 'Saldo tidak mencukupi',
        required: amount,
        balance: userBalance,
        shortfall: amount - userBalance,
      });
    }
    
    // Check for existing active subscription
    const existing = await safeDb(
      `SELECT id, plan, end_date FROM ap_subscriptions WHERE discord_id = ? AND status = 'active' AND (end_date IS NULL OR end_date > ?) LIMIT 1`,
      [discordId, Date.now()]
    );
    
    if (existing.rows && existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Kamu sudah memiliki subscription aktif',
        currentPlan: existing.rows[0].plan,
      });
    }
    
    // Deduct balance
    await vwDb.execute({
      sql: 'UPDATE users SET balance = MAX(0, balance - ?) WHERE id = ?',
      args: [amount, userId],
    });
    
    // Create subscription
    const startDate = Date.now();
    const endDate = planConfig.durationMs ? startDate + planConfig.durationMs : null;
    
    await safeDb(
      `INSERT INTO ap_subscriptions (discord_id, email, plan, amount_paid, start_date, end_date, status, authorized, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [discordId, email, plan, amount, startDate, endDate, 'active', 0, Date.now()]
    );
    
    res.json({
      success: true,
      message: `Paket ${planConfig.label} berhasil diaktifkan! Silakan lakukan authorization.`,
      plan: plan,
      endDate: endDate,
    });
  } catch (err) {
    console.error('[AUTOPOST] Subscribe error:', err.message);
    res.status(500).json({ error: 'Gagal melakukan pembelian' });
  }
});

// POST /api/autopost/authorize — mark authorization as complete
app.post('/api/autopost/authorize', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const discordId = user.id || user.email;
    
    // Get latest active subscription
    const subResult = await safeDb(
      `SELECT id FROM ap_subscriptions WHERE discord_id = ? AND status = 'active' AND (end_date IS NULL OR end_date > ?) ORDER BY id DESC LIMIT 1`,
      [discordId, Date.now()]
    );
    
    if (!subResult.rows || subResult.rows.length === 0) {
      return res.status(400).json({ error: 'Tidak ada subscription aktif. Silakan beli paket terlebih dahulu.' });
    }
    
    const subId = subResult.rows[0].id;
    await safeDb('UPDATE ap_subscriptions SET authorized = 1 WHERE id = ?', [subId]);
    
    res.json({ success: true, message: 'Authorization berhasil! Sekarang kamu bisa membuat misi.' });
  } catch (err) {
    console.error('[AUTOPOST] Authorize error:', err.message);
    res.status(500).json({ error: 'Gagal melakukan authorization' });
  }
});

// GET /api/autopost/missions — list all missions for logged in user
app.get('/api/autopost/missions', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const discordId = user.id || user.email;
    const result = await safeDb('SELECT * FROM ap_missions WHERE discord_id = ? ORDER BY created_at DESC', [discordId]);
    res.json(result.rows || []);
  } catch (err) {
    console.error('[AUTOPOST] Get missions error:', err.message);
    res.status(500).json({ error: 'Failed to load missions' });
  }
});

// POST /api/autopost/mission/save — create or update a mission
app.post('/api/autopost/mission/save', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const discordId = user.id || user.email;
    const { id, name, message, intervalMinutes, channels, customIntervals, filePaths, fileNames, status } = req.body;
    
    if (!id) return res.status(400).json({ error: 'Mission ID required' });
    
    const channelsStr = Array.isArray(channels) ? channels.join(',') : (channels || '');
    const intervalNum = parseInt(intervalMinutes, 10) || 0;
    const customStr = customIntervals && Object.keys(customIntervals).length > 0 ? JSON.stringify(customIntervals) : null;
    
    // Check if exists
    const existing = await safeDb('SELECT id FROM ap_missions WHERE id = ?', [id]);
    
    if (existing.rows.length > 0) {
      await safeDb(
        `UPDATE ap_missions SET name = ?, message = ?, interval_minutes = ?, channels = ?, custom_intervals = ?, file_paths = ?, file_names = ?, status = ? WHERE id = ?`,
        [name || 'Untitled', message || '', intervalNum, channelsStr, customStr, filePaths || null, fileNames || null, status || 'paused', id]
      );
    } else {
      await safeDb(
        `INSERT INTO ap_missions (id, discord_id, name, message, channels, interval_minutes, custom_intervals, file_paths, file_names, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, discordId, name || 'Untitled', message || '', channelsStr, intervalNum, customStr, filePaths || null, fileNames || null, status || 'paused', Date.now()]
      );
    }
    
    // Rebuild channel schedules
    await safeDb('DELETE FROM ap_channel_schedules WHERE mission_id = ?', [id]);
    const chs = Array.isArray(channels) ? channels : [];
    for (const chId of chs) {
      if (!chId.startsWith('wh:')) {
        await safeDb(
          'INSERT INTO ap_channel_schedules (mission_id, channel_id, next_run) VALUES (?, ?, ?)',
          [id, chId, intervalNum > 0 ? Date.now() + intervalNum * 60000 : 0]
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[AUTOPOST] Save mission error:', err.message);
    res.status(500).json({ error: 'Failed to save mission' });
  }
});

// POST /api/autopost/mission/toggle — start/pause mission
app.post('/api/autopost/mission/toggle', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Mission ID required' });
    
    const mission = await safeDb('SELECT status FROM ap_missions WHERE id = ?', [id]);
    if (mission.rows.length === 0) return res.status(404).json({ error: 'Mission not found' });
    
    const newStatus = mission.rows[0].status === 'running' ? 'paused' : 'running';
    await safeDb('UPDATE ap_missions SET status = ? WHERE id = ?', [newStatus, id]);
    res.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('[AUTOPOST] Toggle error:', err.message);
    res.status(500).json({ error: 'Failed to toggle mission' });
  }
});

// DELETE /api/autopost/mission/:id — delete mission
app.delete('/api/autopost/mission/:id', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const { id } = req.params;
    await safeDb('DELETE FROM ap_channel_schedules WHERE mission_id = ?', [id]);
    await safeDb('DELETE FROM ap_missions WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[AUTOPOST] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete mission' });
  }
});

// GET /api/autopost/mission/:id — get single mission
app.get('/api/autopost/mission/:id', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const result = await safeDb('SELECT * FROM ap_missions WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mission not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[AUTOPOST] Get mission error:', err.message);
    res.status(500).json({ error: 'Failed to load mission' });
  }
});

// POST /api/autopost/mission/stats — get mission stats (post count)
app.post('/api/autopost/mission/stats', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const { id } = req.body;
    if (!id) return res.json({ totalPosts: 0 });
    const result = await safeDb(
      "SELECT COUNT(*) as count FROM ap_posting_logs WHERE mission_id = ? AND status = 'success'",
      [id]
    );
    res.json({ totalPosts: result.rows[0]?.count || 0 });
  } catch (err) {
    console.error('[AUTOPOST] Stats error:', err.message);
    res.json({ totalPosts: 0 });
  }
});

// GET /api/autopost/webhooks — list webhooks
app.get('/api/autopost/webhooks', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const discordId = user.id || user.email;
    const result = await safeDb('SELECT * FROM ap_webhooks WHERE discord_id = ? ORDER BY created_at DESC', [discordId]);
    res.json(result.rows || []);
  } catch (err) {
    console.error('[AUTOPOST] Webhooks error:', err.message);
    res.status(500).json({ error: 'Failed to load webhooks' });
  }
});

// POST /api/autopost/webhook/add — add webhook
app.post('/api/autopost/webhook/add', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const discordId = user.id || user.email;
    const { name, url } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Name and URL required' });
    
    await safeDb(
      'INSERT INTO ap_webhooks (discord_id, name, url) VALUES (?, ?, ?)',
      [discordId, name, url]
    );
    const webhooks = await safeDb('SELECT * FROM ap_webhooks WHERE discord_id = ? ORDER BY created_at DESC', [discordId]);
    res.json({ success: true, webhooks: webhooks.rows });
  } catch (err) {
    console.error('[AUTOPOST] Add webhook error:', err.message);
    res.status(500).json({ error: 'Failed to add webhook' });
  }
});

// DELETE /api/autopost/webhook/:id — delete webhook
app.delete('/api/autopost/webhook/:id', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const { id } = req.params;
    await safeDb('DELETE FROM ap_webhooks WHERE id = ?', [parseInt(id, 10)]);
    res.json({ success: true });
  } catch (err) {
    console.error('[AUTOPOST] Delete webhook error:', err.message);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// GET /api/autopost/logs/:missionId — get posting logs
app.get('/api/autopost/logs/:missionId', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    const result = await safeDb(
      'SELECT * FROM ap_posting_logs WHERE mission_id = ? ORDER BY timestamp DESC LIMIT 50',
      [req.params.missionId]
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error('[AUTOPOST] Logs error:', err.message);
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

// GET /api/autopost/channels — get guild channels (via bot-zyo proxy)
app.get('/api/autopost/channels', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const access = await checkAutopostAccess(user);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Akses ditolak', reason: access.reason });
    }
    
    // Try to fetch from bot-zyo's web server first (if running)
    const BOTZYO_API = process.env.BOTZYO_API_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${BOTZYO_API}/api/guilds?userId=${encodeURIComponent(user.id || user.email)}`);
      const data = await response.json();
      return res.json(data);
    } catch (proxyErr) {
      // bot-zyo not available, return empty
      console.log('[AUTOPOST] bot-zyo proxy unavailable:', proxyErr.message);
      return res.json({ guilds: [], channels: [] });
    }
  } catch (err) {
    console.error('[AUTOPOST] Channels error:', err.message);
    res.status(500).json({ error: 'Failed to load channels' });
  }
});

// ─── SNK proxy (call xoftware API with Bearer token) ───
const XO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjUzNjc2OCwibmFtZSI6IiIsInJvbGVfaWQiOm51bGwsImdyb3VwIjoidGVsZWdyYW0iLCJib3RfaWQiOjIwNjAsImlhdCI6MTc4MjQ3NjY5OSwiZXhwIjoxNzg1MDY4Njk5fQ.b3j3gscdOrp-nuybMw6uywNfuUygPEhUzWquI15Zuvw';
const XO_COOKIE = 'SRVGROUP=common';
const XO_CLIENT = 'Djati';

import { setupKinde, GrantType } from "@kinde-oss/kinde-node-express";
import 'dotenv/config';

// Verify KINDE env vars are loaded
if (!process.env.KINDE_DOMAIN) {
  console.error('[KINDE] Missing KINDE_DOMAIN env var. Check .env file.');
  process.exit(1);
}

let kindeClient;
try {
  const result = setupKinde({
    issuerBaseUrl: process.env.KINDE_DOMAIN,
    clientId: process.env.KINDE_CLIENT_ID,
    clientSecret: process.env.KINDE_CLIENT_SECRET,
    redirectUrl: "https://vitalwounds.my.id/api/auth/kinde_callback",
    postLogoutRedirectUrl: "https://vitalwounds.my.id/",
    siteUrl: "https://vitalwounds.my.id/",
    unAuthorisedUrl: "https://vitalwounds.my.id/",
    secret: process.env.KINDE_CLIENT_SECRET || 'random-secret-key-at-least-32-chars-long',
    grantType: GrantType.AUTHORIZATION_CODE
  }, app);
  kindeClient = result.kindeClient || result;
  if (!kindeClient) {
    console.error('[KINDE] Failed: setupKinde returned', result);
    process.exit(1);
  }
  console.log('[KINDE] Client initialized successfully.');
} catch (e) {
  console.error('[KINDE] Initialization failed:', e.message);
  process.exit(1);
}

app.post('/api/snk', rawBody, function(req, res) {
  var body = req.rawBody;
  var productId = 50188;
  try { var parsed = JSON.parse(body); if (parsed && parsed.productId) productId = parsed.productId; } catch(e) {}

  var postData = JSON.stringify({ clientName: XO_CLIENT, productId: productId });

  var options = {
    hostname: 'web.xoftware.id',
    port: 443,
    path: '/api/v2/web/products/detail',
    method: 'POST',
    headers: {
      'accept': '*/*',
      'authorization': 'Bearer ' + XO_TOKEN,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(postData),
      'cookie': XO_COOKIE,
      'origin': 'https://web.xoftware.id',
      'referer': 'https://web.xoftware.id/' + XO_CLIENT,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
    }
  };

  var proxyReq = https.request(options, function(proxyRes) {
    var body = '';
    proxyRes.on('data', function(c) { body += c; });
    proxyRes.on('end', function() {
      try {
        var parsed = JSON.parse(body);
        var snk = '';
        if (parsed && parsed.data) {
          if (parsed.data.snk) snk += parsed.data.snk + '\n';
          if (parsed.data.variations && parsed.data.variations.length) {
            for (var i = 0; i < parsed.data.variations.length; i++) {
              var v = parsed.data.variations[i];
              if (v.snk) snk += '[' + v.title + ']\n' + v.snk + '\n\n';
            }
          }
        }
        if (!snk) snk = (parsed && parsed.snk) || 'Syarat & Ketentuan untuk produk ini tidak tersedia.';
        res.json({ snk: snk.trim() });
      } catch(e) {
        res.json({ snk: 'Gagal memuat Syarat & Ketentuan. Silakan coba lagi.' });
      }
    });
  });

  proxyReq.on('error', function(err) {
    console.error('[SNK] Error:', err.message);
    res.status(502).json({ snk: 'Gagal terhubung ke server.' });
  });

  proxyReq.write(postData);
  proxyReq.end();
});

// --- Kinde User Sync (auto-create user in local DB) ---
app.post("/api/auth/sync", async (req, res) => {
  try {
    const isAuthenticated = await kindeClient.isAuthenticated(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const kindeUser = await kindeClient.getUserProfile(req);
    const email = kindeUser.email || "";
    const givenName = kindeUser.given_name || email.split('@')[0] || "user";
    
    // Check if this is the configured owner/admin email
    const adminEmail = (process.env.KINDE_ADMIN_EMAIL || "").toLowerCase();
    const isOwner = adminEmail && email.toLowerCase() === adminEmail;
    // Owner gets full access, assign 'owner' role directly
    const role = isOwner ? "owner" : "member";
    
    // Call backend API to find/create user
    const target = new URL(API_TARGET);
    const postData = JSON.stringify({
      username: givenName,
      email: email,
      phone: kindeUser.phone_number || "",
      role: role,
      tier: "Regular"
    });
    
    const options = {
      hostname: target.hostname,
      port: target.port || 80,
      path: '/api/auth/kinder-create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const apiReq = http.request(options, function(apiRes) {
      let body = '';
      apiRes.on('data', function(c) { body += c; });
      apiRes.on('end', function() {
        try {
          const data = JSON.parse(body);
          if (data.user) {
            res.json({ ...data, kindeEmail: email, kindeName: givenName });
          } else {
            res.json({ error: 'Sync failed', detail: data });
          }
        } catch (e) {
          res.status(500).json({ error: 'Invalid response from API' });
        }
      });
    });
    
    apiReq.on('error', function(err) {
      console.error('[Sync] API error:', err.message);
      // Fallback: return Kinde user info even if API is down
      res.json({
        user: { username: givenName, email: email, phone: "", balance: 0, tier: "Regular", role: role, apiKey: "vt_live_" + givenName },
        kindeEmail: email,
        kindeName: givenName
      });
    });
    
    apiReq.write(postData);
    apiReq.end();
  } catch (e) {
    console.error('[Sync] Error:', e);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// --- Kinde Auth Routes ---
app.get("/api/auth/login", async (req, res) => {
  const loginUrl = await kindeClient.login(req);
  res.redirect(loginUrl.toString());
});

app.get("/api/auth/register", async (req, res) => {
  const registerUrl = await kindeClient.register(req);
  res.redirect(registerUrl.toString());
});

app.get("/api/auth/kinde_callback", async (req, res) => {
  try {
    await kindeClient.handleRedirectToApp(req, new URL(req.protocol + '://' + req.get('host') + req.originalUrl));
    res.redirect("/");
  } catch (error) {
    console.error("Callback error:", error);
    res.redirect("/auth?error=kinde_callback_failed");
  }
});

app.get("/api/auth/logout", async (req, res) => {
  const logoutUrl = await kindeClient.logout(req);
  res.redirect(logoutUrl.toString());
});

app.get("/api/auth/me", async (req, res) => {
  const isAuthenticated = await kindeClient.isAuthenticated(req);
  if (!isAuthenticated) {
    return res.status(401).json({ authenticated: false });
  }
  const user = await kindeClient.getUserProfile(req);
  res.json({ authenticated: true, user });
});

// --- Proxy /api/* and /pay/* to backend ---

// --- Xoftware Payment Webhook ---
app.post('/api/xoftware/webhook', rawBody, function(req, res) {
  console.log('[Webhook] Received at server.js:', req.method, req.originalUrl);
  
  // Forward to backend API
  const body = req.rawBody;
  if (!body) { return res.status(400).json({ error: 'No body' }); }
  
  var target = new URL(API_TARGET);
  var options = {
    hostname: target.hostname,
    port: target.port || 80,
    path: '/api/xoftware/webhook',
    method: 'POST',
    headers: {
      'host': target.hostname,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body)
    }
  };
  
  var proxyReq = http.request(options, function(proxyRes) {
    var data = '';
    proxyRes.on('data', function(chunk) { data += chunk; });
    proxyRes.on('end', function() {
      console.log('[Webhook] Forwarded to API, response:', proxyRes.statusCode);
      try { res.status(proxyRes.statusCode).json(JSON.parse(data)); } catch(e) { console.error("[Webhook] Invalid JSON from API:", data); res.status(502).json({ error: "Invalid backend response" }); }
    });
  });
  
  proxyReq.on('error', function(err) {
    console.error('[Webhook] Proxy error:', err.message);
    res.status(502).json({ error: 'API unavailable' });
  });
  
  proxyReq.write(body);
  proxyReq.end();
});

app.use(['/api', '/pay'], rawBody, function(req, res) {
  console.log('[Proxy]', req.method, req.originalUrl);

  var target = new URL(API_TARGET);
  var options = {
    hostname: target.hostname,
    port: target.port || 80,
    path: req.originalUrl,
    method: req.method,
    headers: {
      'host': target.hostname,
      'accept': req.headers.accept || '*/*',
      'content-type': req.headers['content-type'] || 'application/octet-stream',
      'content-length': Buffer.byteLength(req.rawBody) || 0,
      'cookie': req.headers.cookie || '',
      'authorization': req.headers.authorization || '',
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
  };

  var proxyReq = http.request(options, function(proxyRes) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', function(err) {
    console.error('[Proxy] Error:', err.message);
    res.status(502).json({ error: 'API unavailable' });
  });

  if (req.rawBody) proxyReq.write(req.rawBody);
  proxyReq.end();
});

// --- Serve static frontend ---
app.use(express.static(join(__dirname, 'dist'), { maxAge: 0 }));

// --- SPA fallback ---
app.get('*', function(req, res) {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Global error handler — prevents Express from returning HTML on errors
app.use(function(err, req, res, next) {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Catch unhandled promise rejections & uncaught exceptions globally
process.on('unhandledRejection', function(reason) {
  console.error('[Server] Unhandled Rejection:', reason);
});
process.on('uncaughtException', function(err) {
  console.error('[Server] Uncaught Exception:', err);
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('Vitalwounds running on http://localhost:' + PORT);
  console.log('API proxy -> ' + API_TARGET);
});
