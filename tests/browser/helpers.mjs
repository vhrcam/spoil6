import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const extensionPath = fileURLToPath(new URL('../../extension', import.meta.url));

export const launch = () => chromium.launchPersistentContext('', {
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : { channel: 'chromium' }),
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});

export const worker = async context => context.serviceWorkers()[0] ?? context.waitForEvent('serviceworker');

export const open = async (context, url, body) => {
  const page = await context.newPage();
  await page.route(url, route => route.fulfill({ contentType: 'text/html', body }));
  await page.goto(url);
  return page;
};
