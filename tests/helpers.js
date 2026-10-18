// Shared setup: opens the app with a given saved state, failing the test on any script error.
const { expect } = require('@playwright/test');
const H = 36e5, DAY = 864e5;

function sampleState(over = {}) {
  const n = Date.now(), d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const t0 = d0.getTime(), ev = [];
  for (let k = 1; k < 8; k++) {
    const day = t0 - k * DAY;
    ev.push({ id: `s${k}`, type: 'sleep', start: day + 1 * H, end: day + 6 * H, data: {} });
    ev.push({ id: `n${k}`, type: 'nurse', start: day + 9 * H, end: day + 9 * H + 15 * 6e4, data: { l: 420, r: 480, last: 'r' } });
    ev.push({ id: `d${k}`, type: 'diaper', start: day + 10 * H, data: { kind: k % 2 ? 'wet' : 'both' } });
  }
  return {
    settings: { name: 'Testbaby', dob: new Date(n - 120 * DAY).toISOString().slice(0, 10), sex: 'f', device: 'Phone A', lang: 'en', updatedAt: 1 },
    events: ev, active: { nurse: null, sleep: null }, prefs: {}, lastBackup: n, sync: { on: false },
    ...over,
  };
}

async function openApp(page, state) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(m.text()); });
  if (state) await page.addInitScript(s => localStorage.setItem('yupu-data-v1', s), JSON.stringify(state));
  await page.goto('/index.html');
  await expect(page.locator('#main')).not.toBeEmpty();
  return errors;
}

module.exports = { sampleState, openApp, H, DAY };
