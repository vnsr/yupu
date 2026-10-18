const { test, expect } = require('@playwright/test');
const { sampleState, openApp, H } = require('./helpers');

test('first run walks through three steps and saves the profile', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.locator('.ob-s[data-s="1"]')).toBeVisible();
  await page.fill('#s-name', 'Mila');
  await page.fill('#s-dob', '2026-06-20');
  await page.click('[data-group="s-sex"][data-val="f"]');
  await page.click('.ob-s[data-s="1"] [data-act="ob-step"]');
  await expect(page.locator('.ob-s[data-s="2"]')).toBeVisible();
  await page.fill('#s-dev', 'Mum');
  await page.click('.ob-s[data-s="2"] [data-n="3"]');
  await page.click('.ob-s[data-s="3"] [data-act="set-save"]');
  await expect(page.locator('#hdrName')).toHaveText('Mila');
  expect(await page.evaluate(() => [S.settings.device, S.settings.sex, S.settings.dob])).toEqual(['Mum', 'f', '2026-06-20']);
  expect(errors).toEqual([]);
});

test('every tab renders without errors', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  for (const t of ['history', 'trends', 'growth', 'checks', 'foods', 'today']) {
    await page.click(`[data-tab="${t}"]`);
    await expect(page.locator(`[data-tab="${t}"]`)).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#main')).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});

test('sleep timer starts and saves an entry', async ({ page }) => {
  await openApp(page, sampleState());
  await page.click('#main .act[data-act="sleep-start"]');
  await expect(page.locator('.timer.c-sleep.running')).toBeVisible();
  // Move the start back so the stop is long enough to be kept.
  await page.evaluate(() => { S.active.sleep.start -= 20 * 6e4; });
  await page.click('#main .act[data-act="sleep-stop"]');
  await expect(page.locator('#toast')).toContainText('Sleep saved');
  expect(await page.evaluate(() => live()[0].type)).toBe('sleep');
});

test('holding Sleep starts it earlier', async ({ page }) => {
  await openApp(page, sampleState());
  const b = await page.locator('#main .act[data-act="sleep-start"]').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up();
  await page.click('[data-act="start-ago"][data-m="15"]');
  const mins = await page.evaluate(() => Math.round((Date.now() - S.active.sleep.start) / 6e4));
  expect(mins).toBe(15);
  expect(await page.evaluate(() => S.prefs.held)).toBe(1);
});

test('holding Left starts nursing earlier on that side', async ({ page }) => {
  await openApp(page, sampleState());
  const b = await page.locator('#main .act[data-side="l"]').boundingBox();
  await page.mouse.move(b.x + 20, b.y + 20);
  await page.mouse.down(); await page.waitForTimeout(650); await page.mouse.up();
  await page.click('[data-act="start-ago"][data-m="5"]');
  const a = await page.evaluate(() => S.active.nurse);
  expect(a.segs[0].side).toBe('l');
  expect(Math.round((Date.now() - a.start) / 6e4)).toBe(5);
});

test('swiping a row left deletes it, Undo brings it back', async ({ page, context }) => {
  await openApp(page, sampleState());
  await page.click('[data-tab="history"]');
  const before = await page.evaluate(() => live().length);
  const r = await page.locator('#main .list .row').first().boundingBox();
  const cdp = await context.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', r.x + 300, r.y + 20);
  for (let k = 1; k <= 10; k++) await touch('touchMove', r.x + 300 - k * 20, r.y + 21);
  await touch('touchEnd');
  await expect(page.locator('#toast')).toContainText('Entry deleted');
  expect(await page.evaluate(() => live().length)).toBe(before - 1);
  await page.click('#toastAction');
  expect(await page.evaluate(() => live().length)).toBe(before);
});

test('a short vertical drag on a row does not delete it', async ({ page, context }) => {
  await openApp(page, sampleState());
  await page.click('[data-tab="history"]');
  const before = await page.evaluate(() => live().length);
  const r = await page.locator('#main .list .row').first().boundingBox();
  const cdp = await context.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', r.x + 200, r.y + 20);
  for (let k = 1; k <= 6; k++) await touch('touchMove', r.x + 195, r.y + 20 + k * 25);
  await touch('touchEnd');
  expect(await page.evaluate(() => live().length)).toBe(before);
});

test('render leaves the DOM alone when nothing changed', async ({ page }) => {
  await openApp(page, sampleState());
  await page.click('[data-tab="history"]');
  const kept = await page.evaluate(() => { const el = document.querySelector('#main .list'); render(); return el === document.querySelector('#main .list'); });
  expect(kept).toBe(true);
});

test('tapping a bar shows that day', async ({ page }) => {
  await openApp(page, sampleState());
  await page.click('[data-tab="trends"]');
  const hit = page.locator('.chart').nth(1).locator('.hit').nth(5);
  await hit.scrollIntoViewIfNeeded();
  await hit.click();
  await expect(page.locator('#toast')).toContainText('5h 00m sleep');
});

test('text size setting scales without sideways scrolling', async ({ page }) => {
  await openApp(page, sampleState({ settings: { ...sampleState().settings, textSize: 'xl' } }));
  await expect(page.locator('html')).toHaveAttribute('data-text', 'xl');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('German interface translates the new 3.2 strings', async ({ page }) => {
  await openApp(page, sampleState({ settings: { ...sampleState().settings, lang: 'de' } }));
  await expect(page.locator('.tip')).toContainText('gedrückt halten');
  await page.click('[data-tab="trends"]');
  await expect(page.locator('#main')).toContainText('Tippe auf einen Tag');
});

test('night light keeps the screen flat (no blur, no glow)', async ({ page }) => {
  await openApp(page, sampleState({ settings: { ...sampleState().settings, night: true } }));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red');
  const st = await page.evaluate(() => ({ nav: getComputedStyle(document.querySelector('nav.tabs')).backdropFilter, act: getComputedStyle(document.querySelector('.act')).boxShadow }));
  expect(st.nav).toBe('none');
  expect(st.act).toBe('none');
});

test('display font is bundled and loads offline-ready', async ({ page }) => {
  await openApp(page, sampleState());
  const ok = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('600 20px Outfit'); });
  expect(ok).toBe(true);
});
