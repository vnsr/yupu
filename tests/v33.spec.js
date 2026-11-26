// 3.3: themes, what you track, medication and pumping as their own entries, stool details.
const { test, expect } = require('@playwright/test');
const { sampleState, openApp, tabTo, H, DAY } = require('./helpers');

test('old Other entries for medication and pumping move to their own types, and restore undoes it', async ({ page }) => {
  const t = Date.now() - 3 * H;
  const errors = await openApp(page, sampleState({ events: [
    { id: 'm1', type: 'other', start: t, data: { label: 'Medication: Paracetamol 2,5 ml', temp: 38.6, note: 'after nap' } },
    { id: 'v1', type: 'other', start: t + 60e3, data: { label: 'Vitamin D' } },
    { id: 'p1', type: 'other', start: t + 2 * 60e3, data: { label: 'Pumping', note: 'left 60 ml, right 50 ml, 15 min, evening' } },
    { id: 'b1', type: 'other', start: t + 3 * 60e3, data: { label: 'Bath' } },
  ] }));
  const ev = await page.evaluate(() => Object.fromEntries(S.events.map(e => [e.id, { type: e.type, data: e.data, hist: (e.hist || []).length }])));
  expect(ev.m1).toEqual({ type: 'med', data: { name: 'Paracetamol', dose: 2.5, unit: 'ml', temp: 38.6, note: 'after nap' }, hist: 1 });
  expect(ev.v1.type).toBe('med');
  expect(ev.v1.data.name).toBe('Vitamin D');
  expect(ev.p1).toEqual({ type: 'pump', data: { l: 60, r: 50, ml: 110, min: 15, note: 'evening' }, hist: 1 });
  expect(ev.b1.type).toBe('other');
  // Pumping entries existed, so Pumping is switched on.
  expect(await page.evaluate(() => S.settings.features.pump)).toBe(true);
  // Restoring the earlier version brings back the Other entry and it stays that way.
  await tabTo(page, 'history');
  await page.click('.row[data-id="m1"]');
  await page.click('[data-act="hist"]');
  await page.click('[data-act="hist-restore"]');
  const back = await page.evaluate(() => { migrateEntries(); const e = S.events.find(x => x.id === 'm1'); return [e.type, e.data.label]; });
  expect(back).toEqual(['other', 'Medication: Paracetamol 2,5 ml']);
  expect(errors).toEqual([]);
});

test('daily Vitamin D card logs a medication entry and counts old-style entries from a 3.2 phone', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  const card = page.locator('#main .vit[data-act="daily"]');
  await expect(card).toContainText('Vitamin D');
  await card.click();
  await expect(page.locator('#main .vit.done')).toContainText('Given today');
  expect(await page.evaluate(() => { const e = live()[0]; return [e.type, e.data.name]; })).toEqual(['med', 'Vitamin D']);
  // An Other "Vitamin D" entry synced from a phone still on 3.2 also counts as given.
  await page.evaluate(() => { S.events = S.events.filter(e => e.type !== 'med'); S.events.push({ id: 'old', type: 'other', start: Date.now() - 6e4, data: { label: 'Vitamin D' } }); render(); });
  await expect(page.locator('#main .vit.done')).toBeVisible();
  expect(errors).toEqual([]);
});

test('medication sheet: name chip, dose, Log again repeats the dose, History filter', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  await page.click('#main .act[data-type="med"]');
  await page.click('[data-act="med-name"][data-v="Ibuprofen"]');
  await page.fill('#f-dose', '2.5');
  await page.click('[data-group="f-munit"][data-val="ml"]');
  await page.click('[data-group="f-mform"][data-val="oral"]');
  await page.click('[data-act="setv"][data-v="Fever"]');
  await page.click('[data-act="ed-save"]');
  await expect(page.locator('#toast')).toContainText('Ibuprofen saved');
  const med = page.locator('#main .med');
  await expect(med).toContainText('Ibuprofen');
  await expect(med).toContainText('2.5 ml');
  await med.locator('[data-act="med-again"]').click();
  await expect(med).toContainText('2 doses in 24 h');
  expect(await page.evaluate(() => live().filter(e => e.type === 'med').map(e => [e.data.name, e.data.dose, e.data.unit, e.data.form]))).toEqual([['Ibuprofen', 2.5, 'ml', 'oral'], ['Ibuprofen', 2.5, 'ml', 'oral']]);
  // Same as last time: picking the name again fills in the dose.
  await page.click('#main .act[data-type="med"]');
  await page.click('[data-act="med-name"][data-v="Ibuprofen"]');
  await expect(page.locator('#f-dose')).toHaveValue('2.5');
  await page.click('[data-act="close"]');
  await tabTo(page, 'history');
  await page.click('[data-act="hist-filter"][data-v="med"]');
  await expect(page.locator('#hist-list .row')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('dirty diaper opens stool details; wet saves in one tap; pale stool is flagged', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  // Diaper opens Wet / Dirty / Both on Today; Wet saves straight away.
  await page.click('#main .act[data-type="diaper"]');
  await page.click('#main .tray [data-kind="wet"]');
  await expect(page.locator('#toast')).toContainText('Diaper saved');
  await expect(page.locator('#main .tray')).toHaveCount(0);
  await page.click('#main .act[data-type="diaper"]');
  await page.click('#main .tray [data-kind="dirty"]');
  await expect(page.locator('#f-stool')).toHaveClass(/open/);
  await page.click('[data-group="f-scol"][data-val="pale"]');
  await page.click('[data-group="f-scons"][data-val="seedy"]');
  await page.click('[data-group="f-samt"][data-val="m"]');
  await page.click('#f-sx [data-v="mucus"]');
  await page.click('#f-rash');
  await page.click('#f-stool [data-act="ed-save"]');
  const e = await page.evaluate(() => S.events[S.events.length - 1]);
  expect(e.data).toEqual({ kind: 'dirty', rash: true, color: 'pale', cons: 'seedy', amt: 'm', x: ['mucus'] });
  const row = page.locator(`#main .list .row[data-id="${e.id}"]`);
  await expect(row).toContainText('Dirty · pale, seedy, medium, mucus, nappy rash');
  await expect(row.locator('small.flag')).toBeVisible();
  expect(errors).toEqual([]);
});

test('stool details off: Dirty saves at once; editing keeps details already there', async ({ page }) => {
  const t = Date.now() - H;
  await openApp(page, sampleState({ settings: { ...sampleState().settings, stool: 'off' }, events: [{ id: 'dd', type: 'diaper', start: t, data: { kind: 'both', color: 'mustard', cons: 'soft' } }] }));
  await page.click('#main .act[data-type="diaper"]');
  await page.click('#main .tray [data-kind="dirty"]');
  await expect(page.locator('#toast')).toContainText('Diaper saved');
  expect(await page.evaluate(() => live()[0].data)).toEqual({ kind: 'dirty' });
  await page.click('#main .row[data-id="dd"]');
  await page.fill('#f-note', 'fine');
  await page.click('[data-act="ed-save"]');
  expect(await page.evaluate(() => S.events.find(e => e.id === 'dd').data)).toEqual({ kind: 'both', color: 'mustard', cons: 'soft', note: 'fine' });
});

test('switching features off hides them everywhere but keeps the entries', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  await page.click('#gearBtn');
  await page.click('.sw-row:has([data-feat="sleep"])');
  await page.click('.sw-row:has([data-feat="growth"])');
  await page.click('.sw-row:has([data-feat="nurse"])');
  expect(await page.evaluate(() => [S.settings.features.sleep, S.settings.features.growth, S.settings.features.nurse])).toEqual([false, false, false]);
  await page.evaluate(() => closeSheet());
  await expect(page.locator('#main .act[data-act="sleep-start"]')).toHaveCount(0);
  await expect(page.locator('#main .act[data-act="nurse-side"]')).toHaveCount(0);
  await expect(page.locator('#main .since .c-sleep')).toHaveCount(0);
  await expect(page.locator('[data-tab="growth"]')).toHaveCount(0);
  await tabTo(page, 'trends');
  await expect(page.locator('#main')).not.toContainText('Sleep per day');
  await tabTo(page, 'history');
  await expect(page.locator('[data-act="hist-filter"][data-v="sleep"]')).toHaveCount(0);
  await expect(page.locator('#hist-list .row.c-sleep').first()).toBeVisible();
  // Quick buttons fill the row: Bottle, Diaper, Solids, Medicine → 2 × 2.
  await tabTo(page, 'today');
  const spans = await page.locator('#main .acts .act').evaluateAll(b => b.map(x => x.style.gridColumn));
  expect(spans).toEqual(['span 3', 'span 3', 'span 3', 'span 3']);
  expect(errors).toEqual([]);
});

test('themes apply at once, survive a reload, and the night light still wins', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  const bg = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  const calm = await bg();
  await page.click('#gearBtn');
  await expect(page.locator('.pal')).toHaveCount(7);
  await page.click('.pal[data-v="sage"]');
  await expect(page.locator('html')).toHaveAttribute('data-pal', 'sage');
  await expect.poll(bg).toBe('#F1F5EF');
  expect(calm).not.toBe('#F1F5EF');
  await page.click('[data-group="s-theme"][data-val="dark"]');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(bg).toBe('#111813');
  await page.click('.pal[data-v="oled"]');
  await expect.poll(bg).toBe('#000000');
  await expect(page.locator('#oled-note')).toBeVisible();
  // The first frame after a reload already has the theme (set before the app loads its data).
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.pal)).toBe('oled');
  await page.evaluate(() => { S.settings.night = true; applyTheme(); });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red');
  await expect.poll(bg).toBe('#000000');
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  expect(accent).toBe('#98291D');
  expect(errors).toEqual([]);
});

test('pumping: total follows left and right, shows in totals and trends', async ({ page }) => {
  const s = sampleState();
  s.settings.features = { pump: true };
  const errors = await openApp(page, s);
  await page.click('#main .act[data-type="pump"]');
  await page.fill('#f-pl', '70');
  await page.fill('#f-pr', '55');
  await expect(page.locator('#f-pml')).toHaveValue('125');
  await page.fill('#f-pmin', '18');
  await page.click('[data-act="ed-save"]');
  expect(await page.evaluate(() => live()[0].data)).toEqual({ l: 70, r: 55, ml: 125, min: 18 });
  await expect(page.locator('#main .totals')).toContainText('125 ml');
  await tabTo(page, 'trends');
  await expect(page.locator('#main')).toContainText('Pumped per day');
  expect(errors).toEqual([]);
});

test('Nara import brings medication, pumping and stool colour and texture across', async ({ page }) => {
  await openApp(page, sampleState());
  const b = await page.evaluate(() => {
    const t = Date.now() - 4 * 36e5;
    const cols = ['Type', '_activityKey', 'Start Date/time (Epoch)', 'Note', '[Breastfeed] Begin Side', '[Diaper] Type', '[Diaper] Dirty Color', '[Diaper] Dirty Texture', '[Diaper] Detail',
      '[Medical] Medication', '[Pump] Left Volume', '[Pump] Left Volume Unit', '[Pump] Right Volume', '[Pump] Right Volume Unit', '[Pump] Duration (Seconds)'];
    const row = o => cols.map(c => o[c] ?? '').join(',');
    const csv = [cols.join(','),
      row({ Type: 'Diaper', _activityKey: 'd1', 'Start Date/time (Epoch)': t, '[Diaper] Type': 'Dirty', '[Diaper] Dirty Color': 'YELLOW', '[Diaper] Dirty Texture': 'SEEDY MUCOUS', '[Diaper] Detail': 'RASH' }),
      row({ Type: 'Medical', _activityKey: 'm1', 'Start Date/time (Epoch)': t + 6e5, '[Medical] Medication': 'Paracetamol 75 mg' }),
      row({ Type: 'Pump', _activityKey: 'p1', 'Start Date/time (Epoch)': t + 12e5, '[Pump] Left Volume': 2, '[Pump] Left Volume Unit': 'oz', '[Pump] Right Volume': 50, '[Pump] Right Volume Unit': 'ml', '[Pump] Duration (Seconds)': 900 }),
    ].join('\n');
    return Object.fromEntries(naraToBackup(csv).events.map(e => [e.id, { type: e.type, data: e.data }]));
  });
  expect(b['nara-d1']).toEqual({ type: 'diaper', data: { kind: 'dirty', rash: true, color: 'yellow', cons: 'seedy', x: ['mucus'] } });
  expect(b['nara-m1']).toEqual({ type: 'med', data: { name: 'Paracetamol', dose: 75, unit: 'mg' } });
  expect(b['nara-p1']).toEqual({ type: 'pump', data: { l: 59, r: 50, ml: 109, min: 15 } });
});

test('visit summary: stool to mention first, medicines grouped with doses', async ({ page }) => {
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const y = t0.getTime() - DAY + 10 * H;
  const s = sampleState();
  s.events.push(
    { id: 'st', type: 'diaper', start: y, data: { kind: 'dirty', color: 'pale', cons: 'soft' } },
    { id: 'i1', type: 'med', start: y + H, data: { name: 'Ibuprofen', dose: 2.5, unit: 'ml' } },
    { id: 'i2', type: 'med', start: y + 7 * H, data: { name: 'Ibuprofen', dose: 2.5, unit: 'ml' } },
  );
  await openApp(page, s);
  const html = await page.evaluate(() => reportHtml(reportData(7), ''));
  expect(html.indexOf('Stool to mention')).toBeGreaterThan(-1);
  expect(html.indexOf('Stool to mention')).toBeLessThan(html.indexOf('Daily averages'));
  expect(html).toContain('pale, soft');
  expect(html).toMatch(/Ibuprofen<\/th><td>2 doses of 2\.5 ml: /);
});

test('German interface translates the 3.3 screens', async ({ page }) => {
  const s = sampleState();
  s.settings.lang = 'de';
  const errors = await openApp(page, s);
  await expect(page.locator('#main .act[data-type="med"]')).toContainText('Medikament');
  await page.click('#main .act[data-type="diaper"]');
  await page.click('#main .tray [data-kind="dirty"]');
  await expect(page.locator('#f-stool')).toContainText('Konsistenz');
  await expect(page.locator('#f-stool')).toContainText('Senfgelb');
  await page.click('[data-group="f-scol"][data-val="mustard"]');
  await page.click('#f-stool [data-act="ed-save"]');
  await expect(page.locator('#main .list .row').first()).toContainText('Voll · senfgelb');
  await page.click('#gearBtn');
  await expect(page.locator('#sheet')).toContainText('Was du einträgst');
  await expect(page.locator('#sheet')).toContainText('Farbthema');
  expect(errors).toEqual([]);
});
