from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.on("console", lambda msg: print(f"Browser Console ({msg.type}): {msg.text}"))
    page.on("pageerror", lambda err: print(f"Browser JS Error: {err.message}"))
    
    response = page.goto('https://vitalwounds.my.id/auth')
    print(f"HTTP Status: {response.status}")
    
    page.wait_for_timeout(3000)
    page.screenshot(path='debug_frontend.png')
    browser.close()