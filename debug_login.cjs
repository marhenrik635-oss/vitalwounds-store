const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('response', async res => {
    if (res.url().includes('/api/login')) {
      console.log('Login API Status:', res.status());
      try {
        console.log('Login API Response:', await res.text());
      } catch (e) {}
    }
  });
  
  await page.goto('https://vitalwounds.my.id/auth');
  await page.fill("input[placeholder='Username atau email']", "admin");
  await page.fill("input[placeholder='••••••••']", "Jatijati10");
  await page.click("form button[type='submit']");
  await page.waitForTimeout(3000);
  await browser.close();
})();