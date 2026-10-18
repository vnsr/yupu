// Data logic, run inside the page so it uses the app's own functions.
const { test, expect } = require('@playwright/test');
const { sampleState, openApp, H } = require('./helpers');

test('merge adds new entries, keeps the newer edit and carries deletions', async ({ page }) => {
  await openApp(page, sampleState());
  const r = await page.evaluate(() => {
    const s1 = S.events.find(e => e.id === 's1'), n1 = S.events.find(e => e.id === 'n1');
    const incoming = { app: 'yupu', events: [
      { id: 'new1', type: 'diaper', start: Date.now() - 36e5, data: { kind: 'wet' }, updatedAt: 5 },
      { ...s1, end: s1.end + 6e5, updatedAt: (s1.updatedAt || 0) + 1000 },
      { id: 'n1', type: 'nurse', start: n1.start, deleted: true, updatedAt: (n1.updatedAt || 0) + 1000 },
      { ...S.events.find(e => e.id === 'd1'), data: { kind: 'dry' }, updatedAt: 0 },
    ] };
    const res = mergeIn(incoming);
    return { res, s1end: S.events.find(e => e.id === 's1').end - s1.end, n1del: !!S.events.find(e => e.id === 'n1').deleted, d1: S.events.find(e => e.id === 'd1').data.kind };
  });
  expect(r.res.added).toBe(1);
  expect(r.res.updated).toBe(2);
  expect(r.s1end).toBe(6e5);
  expect(r.n1del).toBe(true);
  expect(r.d1).not.toBe('dry');
});

test('merge rejects files that are not backups', async ({ page }) => {
  await openApp(page, sampleState());
  const msg = await page.evaluate(() => { try { mergeIn({ foo: 1 }); return 'accepted'; } catch (e) { return e.message; } });
  expect(msg).toMatch(/not a Yupu baby backup/);
});

test('Nara CSV import converts types, units and temperatures, and skips near duplicates', async ({ page }) => {
  await openApp(page, sampleState());
  const r = await page.evaluate(() => {
    const t = Date.now() - 2 * 36e5;
    const cols = ['Type', '_activityKey', 'Start Date/time (Epoch)', 'Note', '[Breastfeed] Begin Side', '[Breastfeed] End Side', '[Breastfeed] Left Duration (Seconds)', '[Breastfeed] Right Duration (Seconds)',
      '[Bottle Feed] Type', '[Bottle Feed] Volume', '[Bottle Feed] Volume Unit', '[Diaper] Type', '[Sleep] End Date/time (Epoch)', '[Growth] Weight', '[Growth] Weight Unit'];
    const row = o => cols.map(c => o[c] ?? '').join(',');
    const csv = [cols.join(','),
      row({ Type: 'Breastfeed', _activityKey: 'a1', 'Start Date/time (Epoch)': t, '[Breastfeed] Begin Side': 'LEFT', '[Breastfeed] End Side': 'RIGHT', '[Breastfeed] Left Duration (Seconds)': 300, '[Breastfeed] Right Duration (Seconds)': 240 }),
      row({ Type: 'Bottle Feed', _activityKey: 'a2', 'Start Date/time (Epoch)': t + 36e5, '[Bottle Feed] Type': 'Formula', '[Bottle Feed] Volume': 4, '[Bottle Feed] Volume Unit': 'oz' }),
      row({ Type: 'Diaper', _activityKey: 'a3', 'Start Date/time (Epoch)': t + 2e6, Note: 'fever 38.4 checked', '[Diaper] Type': 'Dirty Wet' }),
      row({ Type: 'Sleep', _activityKey: 'a4', 'Start Date/time (Epoch)': t - 3 * 36e5, '[Sleep] End Date/time (Epoch)': t - 36e5 }),
      row({ Type: 'Growth', _activityKey: 'a5', 'Start Date/time (Epoch)': t, '[Growth] Weight': 13, '[Growth] Weight Unit': 'lb' }),
    ].join('\n');
    const b = naraToBackup(csv), by = Object.fromEntries(b.events.map(e => [e.id, e]));
    // An entry already logged here within 5 minutes of a Nara entry is skipped.
    S.events.push({ id: 'mine', type: 'nurse', start: t + 60e3, end: t + 6e5, data: { l: 1, r: 1 } });
    const res = mergeIn(b);
    return { nurse: by['nara-a1'].data, ml: by['nara-a2'].data.ml, diaper: by['nara-a3'].data, sleep: by['nara-a4'].end - by['nara-a4'].start, kg: by['nara-a5'].data.kg, res };
  });
  expect(r.nurse).toEqual({ l: 300, r: 240, last: 'r' });
  expect(r.ml).toBe(118);
  expect(r.diaper.kind).toBe('both');
  expect(r.diaper.temp).toBe(38.4);
  expect(r.sleep).toBe(2 * H);
  expect(r.kg).toBeCloseTo(5.897, 3);
  expect(r.res.dupes).toBe(1);
  expect(r.res.added).toBe(4);
});

test('check data finds duplicates and a sleep inside another', async ({ page }) => {
  await openApp(page, sampleState());
  const kinds = await page.evaluate(() => {
    const t = Date.now() - 5 * 36e5;
    S.events.push({ id: 'x1', type: 'diaper', start: t, data: { kind: 'wet' } }, { id: 'x2', type: 'diaper', start: t + 30e3, data: { kind: 'wet' } });
    S.events.push({ id: 'y1', type: 'sleep', start: t, end: t + 3 * 36e5, data: {} }, { id: 'y2', type: 'sleep', start: t + 36e5, end: t + 2 * 36e5, data: {} });
    return healthScan().map(x => x.kind).sort();
  });
  expect(kinds).toEqual(expect.arrayContaining(['dup', 'inside']));
});

test('starting a timer in the future or over a day back is refused', async ({ page }) => {
  await openApp(page, sampleState());
  const r = await page.evaluate(() => [startAt('sleep', '', Date.now() + 5 * 6e4), startAt('sleep', '', Date.now() - 25 * 36e5), S.active.sleep]);
  expect(r).toEqual([false, false, null]);
});

test('duration formatting', async ({ page }) => {
  await openApp(page, sampleState());
  expect(await page.evaluate(() => [dur(0), dur(59e3), dur(5 * 6e4), dur(36e5 + 5 * 6e4), dur(65e3, true), dur(36e5 + 1e3, true)]))
    .toEqual(['0m', '0m', '5m', '1h 05m', '01:05', '1:00:01']);
});
