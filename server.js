import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import https from 'https';
import session from 'express-session';

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

// --- SNK proxy (call xoftware API with Bearer token) ---
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
    
    // Check if this is the configured admin email
    const adminEmail = (process.env.KINDE_ADMIN_EMAIL || "").toLowerCase();
    const role = (adminEmail && email.toLowerCase() === adminEmail) ? "admin" : "member";
    
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

app.listen(PORT, '0.0.0.0', function() {
  console.log('Vitalwounds running on http://localhost:' + PORT);
  console.log('API proxy -> ' + API_TARGET);
});
