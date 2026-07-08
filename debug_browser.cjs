const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  const response = await page.goto('https://vitalwounds.my.id/auth');
  console.log('HTTP Status:', response.status());
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug_frontend_node.png' });
  await browser.close();
})();