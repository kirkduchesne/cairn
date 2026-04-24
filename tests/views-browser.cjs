const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.ISSUE_TEST_URL || 'http://127.0.0.1:8602');
    await page.getByLabel('Issue scope').selectOption('Archived');
    await page.getByLabel('Group issues').selectOption('Priority');
    await page.getByLabel('Sort issues').selectOption('Newest');
    await page.getByText('Reusable views', { exact: true }).click();
    await page.getByLabel('View name', { exact: true }).fill('Archive review');
    await page.getByRole('button', { name: 'Save new view', exact: true }).click();
    await page.getByLabel('Choose saved view').selectOption({ label: 'Archive review' });
    await page.getByRole('button', { name: 'Duplicate selected view', exact: true }).click();
    await page.getByRole('button', { name: 'Move view down', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export views', exact: true }).click();
    const download = await downloadPromise;
    const fs = require('node:fs');
    const backup = fs.readFileSync(await download.path(), 'utf8');
    await page.getByText('Import saved views', { exact: true }).click();
    await page.getByLabel('Views backup JSON').fill(backup);
    await page.getByRole('button', { name: 'Preview views backup', exact: true }).click();
    await page.getByRole('button', { name: 'Import new views', exact: true }).click();
    assert.equal(await page.getByLabel('Choose saved view').locator('option').count(), 5);
    await page.reload();
    await page.getByText('Reusable views', { exact: true }).click();
    await page.getByLabel('Choose saved view').selectOption({ label: 'Archive review' });
    assert.equal(await page.getByLabel('Issue scope').inputValue(), 'Archived');
    assert.equal(await page.getByLabel('Group issues').inputValue(), 'Priority');
    assert.equal(await page.getByLabel('Sort issues').inputValue(), 'Newest');
    console.log('PASS richer views, duplicate, reorder, export, collision-safe import and reload');
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
