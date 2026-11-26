// 3.4 "Smooth": patched updates, gestures, diaper tray, time ruler, sheet and ring motion, button order.
const { test, expect } = require('@playwright/test');
const { sampleState, openApp, tabTo, H } = require('./helpers');

const touchOf = async (page, context) => {
  const cdp = await context.newCDPSession(page);
  return (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
};
// Waits for a sheet to finish growing out of its button.
const sheetReady = page => page.waitForFunction(() => !document.querySelector('#sheet').getAnimations().length);
const today = (over = {}) => {
  const s = sampleState();
  const t = Date.now() - 2 * H;
  s.events.push({ id: 'dt', type: 'diaper', start: t, data: { kind: 'dirty', color: 'mustard' } }, { id: 'ft', type: 'bottle', start: t - H, data: { ml: 120, kind: 'formula' } });
  return { ...s, ...over };
};

test('an update patches the screen: existing rows stay, a new one slides in, a deleted one folds away', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  await tabTo(page, 'history');
  const r = await page.evaluate(() => {
    const li = document.querySelector('#hist-list li[data-key="d1"]');
    upsert({ id: 'zz', type: 'diaper', start: Date.now(), data: { kind: 'wet' } }); render();
    const nw = document.querySelector('#hist-list li[data-key="zz"]');
    return [li.isConnected, li === document.querySelector('#hist-list li[data-key="d1"]'), nw.classList.contains('fx-new')];
  });
  expect(r).toEqual([true, true, true]);
  const folding = await page.evaluate(() => { removeEv('d1'); render(); return document.querySelector('#hist-list li[data-key="d1"]').classList.contains('fx-out'); });
  expect(folding).toBe(true);
  await expect(page.locator('#hist-list li[data-key="d1"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('swiping sideways on Today moves to History, and back', async ({ page, context }) => {
  await openApp(page, sampleState());
  const touch = await touchOf(page, context);
  const b = await page.locator('#main .legend').boundingBox();
  const y = b.y + b.height / 2;
  await touch('touchStart', 330, y);
  for (let k = 1; k <= 12; k++) await touch('touchMove', 330 - k * 18, y + 2);
  await touch('touchEnd');
  await expect(page.locator('[data-tab="history"]')).toHaveAttribute('aria-current', 'page');
  await page.waitForFunction(() => !document.documentElement.dataset.vt);
  const s = await page.locator('#hist-list h3.day').first().boundingBox();
  await touch('touchStart', 110, s.y + s.height / 2);
  for (let k = 1; k <= 12; k++) await touch('touchMove', 110 + k * 18, s.y + s.height / 2 + 1);
  await touch('touchEnd');
  await expect(page.locator('[data-tab="today"]')).toHaveAttribute('aria-current', 'page');
});

test('swiping a row right logs the same again; sleep rows do not repeat', async ({ page, context }) => {
  await openApp(page, sampleState());
  await tabTo(page, 'history');
  const touch = await touchOf(page, context);
  const before = await page.evaluate(() => live().length);
  const swipeRight = async sel => {
    const r = await page.locator(sel).boundingBox();
    await touch('touchStart', r.x + 100, r.y + 20);
    for (let k = 1; k <= 10; k++) await touch('touchMove', r.x + 100 + k * 20, r.y + 21);
    await touch('touchEnd');
  };
  await swipeRight('#hist-list .row[data-id="d2"]');
  await expect(page.locator('#toast')).toContainText('Diaper logged again');
  const e = await page.evaluate(() => live()[0]);
  expect([e.type, e.data.kind, Math.abs(Date.now() - e.start) < 6e4]).toEqual(['diaper', 'both', true]);
  await page.waitForTimeout(400);
  await swipeRight('#hist-list .row[data-id="s2"]');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => live().length)).toBe(before + 1);
});

test('pulling down on Today syncs when automatic sync is on', async ({ page, context }) => {
  await openApp(page, sampleState());
  await page.evaluate(() => { S.sync.on = true; window.__synced = 0; window.autoSync = () => { window.__synced++; return Promise.resolve(); }; });
  const touch = await touchOf(page, context);
  const b = await page.locator('#main .ring').boundingBox();
  await touch('touchStart', b.x + 40, b.y + 30);
  for (let k = 1; k <= 12; k++) await touch('touchMove', b.x + 41, b.y + 30 + k * 18);
  await touch('touchEnd');
  await expect.poll(() => page.evaluate(() => window.__synced)).toBe(1);
});

test('Diaper opens Wet / Dirty / Both on Today; a tap elsewhere closes it; More opens the sheet', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  const btn = page.locator('#main .act[data-type="diaper"]');
  await btn.click();
  await expect(page.locator('#main .tray')).toBeVisible();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await page.click('#hdrName');
  await expect(page.locator('#main .tray')).toHaveCount(0);
  await btn.click();
  await page.click('#main .tray .more');
  await expect(page.locator('#sheet h2')).toHaveText('New diaper');
  await expect(page.locator('#main .tray')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('time ruler: drag back 30 minutes, nudge, keyboard, and another day', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  await page.click('#main .act[data-type="bottle"]');
  await sheetReady(page);
  const r = page.locator('#sheet .ruler');
  await expect(r.locator('.rv b')).toHaveText('Now');
  const w = await r.locator('.ruler-win').boundingBox();
  await page.mouse.move(w.x + w.width / 2, w.y + 30);
  await page.mouse.down();
  await page.mouse.move(w.x + w.width / 2 + 90, w.y + 30, { steps: 8 });
  await page.mouse.up();
  await expect(r.locator('.rv b')).toHaveText('30 min ago');
  await page.click('#sheet [data-act="rnudge"][data-d="1"]');
  await expect(r.locator('.rv b')).toHaveText('31 min ago');
  await r.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(r.locator('.rv b')).toHaveText('35 min ago');
  await page.click('[data-act="ed-save"]');
  const mins = await page.evaluate(() => Math.round((Date.now() - live()[0].start) / 6e4));
  expect(Math.abs(mins - 35)).toBeLessThanOrEqual(1);
  // Further back: the date and time field.
  await page.click('#main .act[data-type="bottle"]');
  await sheetReady(page);
  await page.click('#sheet [data-act="rexact"]');
  await expect(page.locator('#f-start')).toBeVisible();
  await expect(page.locator('#sheet .ruler')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a sheet grows out of the button that opened it', async ({ page }) => {
  await openApp(page, sampleState());
  const n = await page.evaluate(() => { document.querySelector('#main .act[data-type="bottle"]').click(); return document.querySelector('#sheet').getAnimations().length; });
  expect(n).toBeGreaterThan(0);
});

test('timer digits roll; logging pops the button with a check; saves show a check in the toast', async ({ page }) => {
  await openApp(page, sampleState());
  await page.click('#main .act[data-act="sleep-start"]');
  const stop = page.locator('#main .act[data-act="sleep-stop"]');
  await expect(stop).toHaveClass(/fx-pop/);
  await expect(stop.locator('.chk')).toHaveCount(1);
  await expect(page.locator('#toast .tchk')).toHaveCount(1);
  const big = page.locator('.timer-big');
  await expect(big.locator('.rc')).toHaveCount(5);
  await expect.poll(() => big.evaluate(el => el.querySelectorAll('.ri').length + (el.dataset.rv !== '00:00' ? 1 : 0)), { timeout: 3000 }).toBeGreaterThan(0);
});

test('day ring: tapping a marker opens that entry; the hand is turned to now', async ({ page }) => {
  const errors = await openApp(page, today());
  const deg = await page.locator('.ring .handg').evaluate(g => parseFloat(g.style.transform.replace(/[^\d.]/g, '')));
  const expected = await page.evaluate(() => { const d = new Date(); return (d.getHours() * 60 + d.getMinutes()) / 1440 * 360; });
  expect(Math.abs(deg - expected)).toBeLessThan(2);
  // Markers pop in after the arcs have drawn; tap once they're there.
  await page.waitForTimeout(1200);
  await page.locator('.ring .mk[data-id="dt"] .rhit').click({ force: true });
  await expect(page.locator('#sheet h2')).toHaveText('Edit diaper');
  expect(errors).toEqual([]);
});

test('quick buttons can be reordered in Settings', async ({ page }) => {
  await openApp(page, sampleState());
  const order = () => page.locator('#main .acts .act').evaluateAll(b => b.map(x => x.dataset.type || x.dataset.side || x.dataset.act));
  expect((await order()).slice(-2)).toEqual(['solids', 'med']);
  await page.click('#gearBtn');
  await page.click('[data-act="ord"][data-v="med"][data-d="-1"]');
  expect(await page.evaluate(() => S.settings.order.filter(k => feat(k)).slice(-2))).toEqual(['med', 'solids']);
  await page.evaluate(() => closeSheet());
  expect((await order()).slice(-2)).toEqual(['med', 'solids']);
});

test('trend bars grow in one after another', async ({ page }) => {
  await openApp(page, sampleState());
  await tabTo(page, 'trends');
  const i = await page.locator('.chart .bar').evaluateAll(b => b.slice(0, 3).map(x => x.style.getPropertyValue('--i')));
  expect(i).toEqual(['0', '1', '2']);
});
