import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open } from './helpers.mjs';

let context;
before(async () => { context = await launch(); });
after(() => context?.close());

test('covers GTA 6 videos on TikTok from their captions', async () => {
  const page = await open(context, 'https://www.tiktok.com/search?q=dinner', `<!doctype html><html><head><title>TikTok</title></head><body>
    <div data-e2e="search_top-item"><a href="/@fan/video/1"><img alt="this mission had me screaming #gta6 created by fan with original sound"></a></div>
    <div data-e2e="search_top-item"><a href="/@cook/video/2"><img alt="pasta night created by cook with original sound"></a></div>
  </body></html>`);
  await page.waitForSelector('[data-spoil6="hidden"]');
  const items = await page.$$eval('[data-e2e="search_top-item"]', els => els.map(e => e.dataset.spoil6Label || ''));
  assert.deepEqual(items, ['Possible GTA 6 spoiler · Show', '']);
});

test('stops on a TikTok video page about GTA 6', async () => {
  const page = await open(context, 'https://www.tiktok.com/@fan/video/1',
    '<!doctype html><html><head><title>this mission had me screaming #gta6 | TikTok</title></head><body><video></video></body></html>');
  await page.waitForSelector('spoil6-gate');
  assert.equal(await page.locator('spoil6-gate h1').textContent(), 'This page might spoil GTA 6');
});
