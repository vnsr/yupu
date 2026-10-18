// Runs the app from this folder in Chromium at iPhone size. `npm test` starts the server itself.
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, timezoneId: 'Europe/Berlin', locale: 'en-GB' },
  webServer: { command: 'python3 -m http.server 4173', stdout: 'ignore', stderr: 'ignore', url: 'http://localhost:4173/index.html', reuseExistingServer: !process.env.CI },
});
