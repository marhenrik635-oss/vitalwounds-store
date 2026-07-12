const fs = require('fs');
let code = fs.readFileSync('vitalwounds-api/index.js', 'utf8');

// Fix 1: deposit-status endpoint - UPDATE with status='pending' check
code = code.replace(
  "db.run('UPDATE deposits SET status = ? WHERE transactionId = ?', ['success', transactionId], (uErr) => {",
  "db.run('UPDATE deposits SET status = ? WHERE transactionId = ? AND status = ?', ['success', transactionId, 'pending'], (uErr) => {"
);

// Fix 2: webhook handler - UPDATE with status='pending' check
code = code.replace(
  "db.run('UPDATE deposits SET status = ? WHERE transactionId = ?', ['success', transactionId], (uErr) => {",
  "db.run('UPDATE deposits SET status = ? WHERE transactionId = ? AND status = ?', ['success', transactionId, 'pending'], (uErr) => {"
);

// Fix 3: auto-check function - UPDATE with status='pending' check
code = code.replace(
  "db.run('UPDATE deposits SET status = ? WHERE transactionId = ?', ['success', dep.transactionId], (uErr) => {",
  "db.run('UPDATE deposits SET status = ? WHERE transactionId = ? AND status = ?', ['success', dep.transactionId, 'pending'], (uErr) => {"
);

// Fix 4: auto-check function - add this.changes check to prevent double-credit
code = code.replace(
  "if (uErr) { console.error('[AutoCheck] Update failed:', uErr.message); }\n                            else {\n                                db.run('UPDATE users SET balance = balance + ? WHERE username = ?', [dep.amount, dep.username], (balErr) => {",
  "if (uErr) {\n                                console.error('[AutoCheck] Update failed:', uErr.message);\n                            } else if (this.changes === 0) {\n                                console.log('[AutoCheck] Skipped (already processed):', dep.transactionId);\n                            } else {\n                                db.run('UPDATE users SET balance = balance + ? WHERE username = ?', [dep.amount, dep.username], (balErr) => {"
);

// Fix 5: webhook handler - add this.changes check to prevent double-credit
code = code.replace(
  "if (uErr) { return res.status(500).json({ error: 'Update failed' }); }\n                    db.run('UPDATE users SET balance = balance + ? WHERE username = ?', [dep.amount, dep.username], (balErr) => {",
  "if (uErr) {\n                        return res.status(500).json({ error: 'Update failed' });\n                    }\n                    if (this.changes === 0) {\n                        return res.json({ status: 'already_processed' });\n                    }\n                    db.run('UPDATE users SET balance = balance + ? WHERE username = ?', [dep.amount, dep.username], (balErr) => {"
);

// Fix 6: deposit-status endpoint - add this.changes check
code = code.replace(
  "if (uErr) { console.error('[DepositStatus] Update error:', uErr.message); return res.status(500).json({ error: 'Update failed' }); }\n                db.run('UPDATE users SET balance = balance + ? WHERE username = ?', [dep.amount, dep.username], (balErr) => {",
  "if (uErr) {\n                        console.error('[DepositStatus] Update error:', uErr.message);\n                        return res.status(500).json({ error: 'Update failed' });\n                    }\n                    if (this.changes === 0) {\n                        return res.json({ status: 'already_processed', transactionId });\n                    }\n                    db.run('UPDATE users SET balance = balance + ? WHERE username = ?', [dep.amount, dep.username], (balErr) => {"
);

fs.writeFileSync('vitalwounds-api/index.js', code, 'utf8');
console.log('Race condition fixes applied successfully!');
