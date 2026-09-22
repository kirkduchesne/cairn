const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(process.env.ISSUE_TEST_URL || 'http://127.0.0.1:8602');
    await page.getByLabel('Title', { exact: true }).fill('Archive example');
    await page.getByLabel('Tags (comma separated)').fill('web, bug');
    await page.getByRole('button', { name: 'Add issue', exact: true }).click();
    assert(
      await page
        .getByRole('button', { name: 'Archive Archive example', exact: true })
        .isDisabled(),
    );
    await page.getByLabel('Status for Archive example').selectOption('Done');
    await page
      .getByRole('button', { name: 'Select visible issues', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Archive selected', exact: true })
      .click();
    assert.equal(await page.locator('article').count(), 0);
    await page
      .getByRole('button', { name: 'Undo last batch', exact: true })
      .click();
    assert.equal(await page.locator('article').count(), 1);
    await page
      .getByRole('button', { name: 'Archive Archive example', exact: true })
      .click();
    await page.getByLabel('Issue scope').selectOption('Archived');
    assert(
      await page
        .getByRole('button', { name: 'Edit Archive example', exact: true })
        .isDisabled(),
    );
    assert(await page.getByLabel('Status for Archive example').isDisabled());
    await page.reload();
    await page.getByLabel('Issue scope').selectOption('Archived');
    await page
      .getByRole('button', { name: 'Restore Archive example', exact: true })
      .click();
    await page.getByLabel('Issue scope').selectOption('Active');
    assert.equal(await page.locator('article').count(), 1);
    console.log(
      'PASS archive eligibility, batch undo, read-only archive, reload and restore',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
