// 3.5 security: page security policy, checking data from outside, token reach, end-to-end encryption.
const { test, expect } = require('@playwright/test');
const { sampleState, openApp } = require('./helpers');

test('security policy is in place and blocks inline scripts', async ({ page }) => {
  await openApp(page, sampleState());
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("connect-src 'self' https://api.github.com");
  expect(csp).toContain("object-src 'none'");
  // The first-frame theme script now loads from its own file: no inline scripts in the page.
  expect(await page.locator('script:not([src])').count()).toBe(0);
  const ran = await page.evaluate(() => new Promise(res => {
    document.addEventListener('securitypolicyviolation', () => res('blocked'), { once: true });
    const s = document.createElement('script'); s.textContent = 'window.__inline = 1'; document.head.appendChild(s);
    setTimeout(() => res(window.__inline ? 'ran' : 'blocked'), 300);
  }));
  expect(ran).toBe('blocked');
});

test('every tab and Settings open without any security policy violation', async ({ page }) => {
  const errors = await openApp(page, sampleState());
  const v = [];
  await page.exposeFunction('__cspv', x => v.push(x));
  await page.evaluate(() => document.addEventListener('securitypolicyviolation', e => window.__cspv(e.violatedDirective + ' ' + e.blockedURI)));
  for (const t of ['history', 'trends', 'growth', 'checks', 'foods', 'today']) { await page.click(`[data-tab="${t}"]`); await page.waitForTimeout(450); }
  await page.click('#gearBtn');
  await page.waitForTimeout(400);
  expect(v).toEqual([]);
  expect(errors).toEqual([]);
});

test('imports leave out malformed entries and clean the rest', async ({ page }) => {
  await openApp(page, sampleState());
  const r = await page.evaluate(() => {
    const t = Date.now() - 36e5;
    const res = mergeIn({ app: 'yupu', events: [
      { id: 'ok1', type: 'diaper', start: t, data: { kind: 'dirty', color: 'mustard', cons: 'nonsense', note: 'x'.repeat(5000), constructor: 'bad', x: ['mucus', 'evil'] } },
      { id: 'bad"><img src=x onerror=alert(1)>', type: 'diaper', start: t, data: { kind: 'wet' } },
      { id: 'bad2', type: 'script', start: t, data: {} },
      { id: 'bad3', type: 'sleep', start: 'yesterday', data: {} },
      { id: 'bad4', type: 'sleep', start: t, end: t - 1000, data: {} },
      { id: 'bad5', type: 'bottle', start: t, data: [1, 2] },
      { id: 'ok2', type: 'solids', start: t, data: { food: 'Pear', reaction: 'exploded', allergens: ['Egg', 3, { a: 1 }] } },
    ], settings: { name: 'X'.repeat(500), dob: '<b>', sex: 'q', updatedAt: Date.now() } });
    const g = id => S.events.find(e => e.id === id);
    return { res, ok1: g('ok1').data, ok2: g('ok2').data, ids: S.events.map(e => e.id).filter(i => i.startsWith('bad')), name: S.settings.name.length, dob: S.settings.dob, sex: S.settings.sex };
  });
  expect(r.res.added).toBe(2);
  expect(r.res.skipped).toBe(5);
  expect(r.ids).toEqual([]);
  expect(r.ok1).toEqual({ kind: 'dirty', color: 'mustard', note: 'x'.repeat(2000), x: ['mucus'] });
  expect(r.ok2).toEqual({ food: 'Pear', allergens: ['Egg'] });
  expect([r.name, r.dob, r.sex]).toEqual([60, '', '']);
});

test('a malformed running timer from the other phone is ignored', async ({ page }) => {
  await openApp(page, sampleState());
  const a = await page.evaluate(() => {
    mergeRemote({ app: 'yupu', kind: 'active', nurse: { v: { id: 'x', start: 'soon', segs: 'no' }, upd: Date.now() }, sleep: { v: { id: 'ok', start: Date.now() - 6e4, by: 'B' }, upd: Date.now() } });
    return [S.active.nurse, S.active.sleep && S.active.sleep.id];
  });
  expect(a).toEqual([null, 'ok']);
});

test('turning sync on warns when the token reaches other private repositories', async ({ page }) => {
  await openApp(page, sampleState());
  await page.route('https://api.github.com/**', route => {
    const u = route.request().url();
    if (u.includes('/user/repos')) return route.fulfill({ json: [{ full_name: 'me/data' }, { full_name: 'me/secret-work' }] });
    if (u.endsWith('/repos/me/data')) return route.fulfill({ json: { private: true, full_name: 'me/data' } });
    return route.fulfill({ status: 404, json: {} });
  });
  let msg = '';
  page.on('dialog', d => { msg = d.message(); d.dismiss(); });
  await page.click('#gearBtn');
  await page.fill('#s-repo', 'me/data');
  await page.fill('#s-token', 'github_pat_abc');
  await page.click('[data-act="sync-on"]');
  await expect.poll(() => msg).toContain('1 other private repository');
  expect(await page.evaluate(() => S.sync.on)).toBe(false);
});

test('encryption: sealed text holds no plain data, opens with the passphrase, refuses a wrong one', async ({ page }) => {
  await openApp(page, sampleState());
  const r = await page.evaluate(async () => {
    S.enc = { on: true, pass: 'correct horse battery', salt: newSalt() };
    const sealed = await sealText(JSON.stringify({ app: 'yupu', kind: 'month', events: [{ id: 'q', type: 'med', start: Date.now() - 1, data: { name: 'Paracetamol' } }] }));
    const back = await openText(sealed);
    let wrong = ''; try { await openText(sealed, 'wrong passphrase!!'); } catch (e) { wrong = e.code; }
    let none = ''; try { await openText(sealed, ''); } catch (e) { none = e.code; }
    const o = JSON.parse(sealed);
    return { plain: sealed.includes('Paracetamol'), header: [o.enc, o.alg, o.kdf, o.it], name: back.events[0].data.name, wrong, none, iv2: JSON.parse(await sealText('x')).iv !== o.iv };
  });
  expect(r.plain).toBe(false);
  expect(r.header).toEqual([1, 'AES-GCM-256', 'PBKDF2-SHA256', 600000]);
  expect(r.name).toBe('Paracetamol');
  expect([r.wrong, r.none, r.iv2]).toEqual(['passphrase', 'locked', true]);
});

// A fake sync repository: the files given, and a record of what the app tries to write.
async function fakeRepo(page, files) {
  const puts = [];
  await page.route('https://api.github.com/**', async route => {
    const req = route.request(), u = new URL(req.url()), p = u.pathname;
    if (req.method() === 'PUT') { puts.push({ path: p, body: JSON.parse(req.postData()) }); return route.fulfill({ json: { content: { sha: 'new' + puts.length } } }); }
    if (p.endsWith('/contents/yupu')) return route.fulfill({ json: Object.keys(files).map((n, i) => ({ type: 'file', name: n, sha: 's' + i })) });
    const n = p.split('/').pop();
    if (files[n] != null) return route.fulfill({ body: files[n], contentType: 'application/json' });
    return route.fulfill({ status: 404, json: {} });
  });
  return puts;
}
const seal = (page, obj, pass, salt) => page.evaluate(([o, p, s]) => sealText(JSON.stringify(o), p, s), [obj, pass, salt]);

test('sync reads plain and encrypted files together and writes encrypted ones', async ({ page }) => {
  await openApp(page, sampleState());
  const salt = await page.evaluate(() => newSalt());
  const t = Date.now() - 2 * 36e5, mk = await page.evaluate(x => monthKey(x), t);
  const enc = await seal(page, { app: 'yupu', kind: 'month', events: [{ id: 'e1', type: 'diaper', start: t, data: { kind: 'wet' }, updatedAt: 5 }] }, 'shared passphrase', salt);
  const plain = JSON.stringify({ app: 'yupu', kind: 'month', events: [{ id: 'p1', type: 'diaper', start: t + 1000, data: { kind: 'dirty' }, updatedAt: 5 }] });
  const puts = await fakeRepo(page, { [`${mk}.json`]: enc, '2020-01.json': plain });
  await page.evaluate(([s]) => { Object.assign(S.sync, { on: true, repo: 'me/data', token: 'github_pat_x', shas: {}, dirty: {} }); S.enc = { on: true, pass: 'shared passphrase', salt: s }; }, [salt]);
  await page.evaluate(() => autoSync());
  const r = await page.evaluate(() => [S.events.some(e => e.id === 'e1'), S.events.some(e => e.id === 'p1'), S.sync.err]);
  expect(r).toEqual([true, true, '']);
  // A new entry goes up sealed.
  await page.evaluate(() => { upsert({ id: 'n1', type: 'bottle', start: Date.now() - 6e4, data: { ml: 90, kind: 'formula' } }); return autoSync(); });
  const month = puts.filter(x => /\d{4}-\d{2}\.json$/.test(x.path)).pop();
  const text = Buffer.from(month.body.content, 'base64').toString('utf8');
  expect(JSON.parse(text).enc).toBe(1);
  expect(text).not.toContain('formula');
});

test('a wrong passphrase stops the sync before anything is written', async ({ page }) => {
  await openApp(page, sampleState());
  const salt = await page.evaluate(() => newSalt());
  const enc = await seal(page, { app: 'yupu', kind: 'month', events: [] }, 'the right passphrase', salt);
  const puts = await fakeRepo(page, { '2026-01.json': enc });
  await page.evaluate(([s]) => { Object.assign(S.sync, { on: true, repo: 'me/data', token: 'github_pat_x', shas: {}, dirty: { profile: 1, active: 1 } }); S.enc = { on: true, pass: 'a wrong passphrase', salt: s }; }, [salt]);
  await page.evaluate(() => autoSync());
  expect(puts).toEqual([]);
  expect(await page.evaluate(() => S.sync.err)).toContain('passphrase');
  // Without encryption on this phone, sealed files also stop it: nothing is written unencrypted over them.
  await page.evaluate(() => { S.enc = { on: false, pass: '', salt: '' }; S.sync.err = ''; return autoSync(); });
  expect(puts).toEqual([]);
  expect(await page.evaluate(() => S.sync.err)).toContain('encrypted');
});

test('backups are encrypted when encryption is on, and import back with the passphrase', async ({ page }) => {
  await openApp(page, sampleState());
  const text = await page.evaluate(async () => {
    S.enc = { on: true, pass: 'backup passphrase', salt: newSalt() };
    let out = ''; window.shareFile = async (n, t) => { out = t; return true; };
    await doBackup(true); return out;
  });
  expect(JSON.parse(text).enc).toBe(1);
  expect(text).not.toContain('Testbaby');
  const r = await page.evaluate(async t => { const n = S.events.length; S.events = []; const o = await openBackup(t); const res = mergeIn(o); return [res.added, n]; }, text);
  expect(r[0]).toBe(r[1]);
});
