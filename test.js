const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // shows browser
  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log('It worked!');
  await browser.close();
})();
