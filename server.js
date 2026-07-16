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

// GET /api/autopost/missions — list all missions for logged in user
app.get('/api/autopost/missions', async (req, res) => {
  try {
    const user = await getKindeUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
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
