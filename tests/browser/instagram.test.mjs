import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open } from './helpers.mjs';

let context;
before(async () => { context = await launch(); });
after(() => context?.close());

test('covers GTA 6 posts in the Instagram feed and grids', async () => {
  const page = await open(context, 'https://www.instagram.com/', `<!doctype html><html><head><title>Instagram</title></head><body>
    <article id="feed-gta"><a href="/fan/">fan</a><img alt="May be an image of text that says 'GTA VI'"><span>day three</span></article>
    <article id="feed-cat"><a href="/pal/">pal</a><img alt="May be an image of a cat"><span>sleepy</span></article>
    <a id="tile-gta" href="/p/abc/"><img alt="Photo by fan. the ending of GTA 6 got me"></a>
    <a id="tile-food" href="/p/def/"><img alt="Photo by cook. pasta night"></a>
  </body></html>`);
  await page.waitForSelector('[data-spoil6="hidden"]');
  const covered = await page.$$eval('[data-spoil6="hidden"]', els => els.map(e => e.id));
  assert.deepEqual(covered, ['feed-gta', 'tile-gta']);
});

test('stops on an Instagram post page about GTA 6', async () => {
  const page = await open(context, 'https://www.instagram.com/p/abc/',
    '<!doctype html><html><head><title>fan on Instagram: "GTA 6 is unreal"</title></head><body><img alt=""></body></html>');
  await page.waitForSelector('spoil6-gate');
  assert.equal(await page.locator('spoil6-gate h1').textContent(), 'This page is about GTA 6');
});
