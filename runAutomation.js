// runAutomation.js
const { chromium } = require('playwright');

async function runAutomation() {
  const browser = await chromium.launch({ headless: false }); // show the browser
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.waitForTimeout(1500);
  await browser.close();
}

module.exports = { runAutomation };