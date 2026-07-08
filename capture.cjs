const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api')) {
      console.log('API Request:', request.method(), url);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('products') || url.includes('product') || url.includes('api')) {
      console.log('API Response:', response.status(), url);
      try {
        const text = await response.text();
        console.log('Response excerpt:', text.substring(0, 300));
      } catch (e) {}
    }
  });

  await page.goto('https://web.xoftware.id/Djati');
  await page.waitForTimeout(5000);
  await browser.close();
})();
