const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 },
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.ISSUE_TEST_URL || 'http://127.0.0.1:8602');
    const title = 'x'.repeat(100);
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Tags (comma separated)').fill('t'.repeat(24));
    await page.getByRole('button', { name: 'Add issue', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByLabel('Status for ' + title).selectOption('Done');
    await page
      .getByRole('button', { name: 'Archive ' + title, exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await page.getByLabel('Issue scope').selectOption('Archived');
    await page.getByLabel('Group issues').selectOption('Priority');
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page
      .getByRole('button', { name: 'Restore ' + title, exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await page.getByLabel('Issue scope').selectOption('Active');
    assert.equal(await page.locator('article').count(), 1);
    await page.keyboard.press('Alt+n');
    assert(
      await page
        .getByLabel('Title', { exact: true })
        .evaluate((node) => node === document.activeElement),
    );
    assert.deepEqual(errors, []);
    await page.screenshot({
      path: '/tmp/issue-desk-2026-mobile.png',
      fullPage: true,
    });
    console.log(
      'PASS 375px tags, grouped archives, keyboard archive/restore and shortcuts',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
