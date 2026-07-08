const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  try {
    // 1. Navigate to the landing page first to establish origin
    console.log('Navigating to landing page...');
    await page.goto('https://vitalwounds.my.id/', { waitUntil: 'networkidle' });
    
    // 2. Set localStorage to simulate logged in state
    console.log('Setting localStorage session keys...');
    await page.evaluate(() => {
      localStorage.setItem('vw_is_logged_in', 'true');
      localStorage.setItem('vw_current_user', 'admin');
    });

    // 3. Navigate directly to dashboard
    console.log('Navigating directly to dashboard...');
    await page.goto('https://vitalwounds.my.id/dashboard', { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'dashboard-before-refresh.png' });
    console.log('Screenshot saved as dashboard-before-refresh.png');

    // 4. Hard refresh (reload)
    console.log('Performing hard refresh...');
    await page.reload({ waitUntil: 'networkidle' });
    console.log('Reload complete.');

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'dashboard-after-refresh.png' });
    console.log('Screenshot saved as dashboard-after-refresh.png');

    // 5. Verify UI visibility
    const walletVisible = await page.locator('text=Saldo Dompet').isVisible();
    const welcomeVisible = await page.locator('text=Restock Akun Premium').isVisible();
    console.log('Is "Saldo Dompet" visible?', walletVisible);
    console.log('Is "Restock Akun Premium" visible?', welcomeVisible);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();
