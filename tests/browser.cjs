// Requires Playwright externally; run against an already started local server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 1000 },
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(process.env.ISSUE_TEST_URL || 'http://127.0.0.1:8502');
    for (const [title, priority] of [
      ['Polish the empty state', 'High'],
      ['Check keyboard navigation', 'Normal'],
      ['Review release notes', 'Low'],
    ]) {
      await page.getByLabel('Title', { exact: true }).fill(title);
      await page
        .getByRole('combobox', { name: /^Priority/ })
        .selectOption(priority);
      await page
        .getByRole('button', { name: 'Add issue', exact: true })
        .click();
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
    }
    await page
      .getByRole('combobox', { name: /^Filter priority/ })
      .selectOption('High');
    await page.getByText('Reusable views', { exact: true }).click();
    await page.getByLabel('View name', { exact: true }).fill('Priority work');
    await page.getByRole('button', { name: 'Save new view' }).click();
    const value = await page
      .getByRole('combobox', { name: /^Choose saved view/ })
      .locator('option')
      .last()
      .getAttribute('value');
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await page
      .getByRole('combobox', { name: /^Choose saved view/ })
      .selectOption(value);
    await page.waitForFunction(
      () => document.querySelectorAll('article').length === 1,
    );
    assert.equal(await page.locator('article').count(), 1);
    await page.reload();
    await page.getByText('Reusable views', { exact: true }).click();
    await page
      .getByRole('combobox', { name: /^Choose saved view/ })
      .selectOption(value);
    await page.waitForFunction(
      () => document.querySelectorAll('article').length === 1,
    );
    assert.equal(await page.locator('article').count(), 1);
    await page.getByRole('button', { name: 'Select visible issues' }).click();
    await page
      .getByRole('button', { name: 'Apply status', exact: true })
      .click();
    assert.equal(
      await page.getByLabel('Status for Polish the empty state').inputValue(),
      'Done',
    );
    await page.getByRole('button', { name: 'Undo last batch' }).click();
    assert.equal(
      await page.getByLabel('Status for Polish the empty state').inputValue(),
      'Open',
    );
    await page.getByText('Backups', { exact: true }).click();
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export visible issues' }).click();
    assert.match(
      (await downloaded).suggestedFilename(),
      /^issue-desk-visible-\d{4}-\d{2}-\d{2}\.json$/,
    );
    await page.getByText('Restore a backup', { exact: true }).click();
    await page.getByLabel('Backup JSON', { exact: true }).fill(
      JSON.stringify({
        version: 1,
        issues: [
          {
            id: 'imported',
            title: 'Verify the backup',
            notes: '',
            status: 'Open',
          },
        ],
      }),
    );
    await page.getByRole('button', { name: 'Preview backup' }).click();
    await page.getByRole('button', { name: 'Cancel import' }).click();
    await page.getByRole('button', { name: 'Preview backup' }).click();
    await page.getByRole('button', { name: 'Import new issues' }).click();
    assert.equal(
      await page
        .getByLabel('Backup JSON', { exact: true })
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('article').length === 4,
    );
    assert.equal(await page.locator('article').count(), 4);
    await page.keyboard.press('Alt+f');
    assert.equal(
      await page
        .getByLabel('Search issues')
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.keyboard.press('Alt+n');
    assert.equal(
      await page
        .getByLabel('Title', { exact: true })
        .evaluate((element) => element === document.activeElement),
      true,
    );
    await page.getByText('Backups', { exact: true }).click();
    await page.getByText('Reusable views', { exact: true }).click();
    const screenshots = process.env.SCREENSHOT_DIR || '/tmp';
    await page.screenshot({
      path: path.join(screenshots, 'issue-desk-2025-desktop.png'),
      fullPage: true,
    });
    await page.setViewportSize({ width: 375, height: 812 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(screenshots, 'issue-desk-2025-mobile.png'),
      fullPage: true,
    });
    await page.getByLabel('Title', { exact: true }).fill('x'.repeat(100));
    await page.getByLabel('Notes', { exact: true }).fill('y'.repeat(1000));
    await page.getByRole('button', { name: 'Add issue', exact: true }).click();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS views/reload, filtered batch/undo, scoped export, import preview/cancel/confirm, keyboard focus, mobile/max lengths, no page errors',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
