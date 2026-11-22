import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open } from './helpers.mjs';

let context;
before(async () => { context = await launch(); });
after(() => context?.close());

const tweet = (id, text, extra = '') =>
  `<div data-testid="cellInnerDiv"><div><article data-testid="tweet"><div data-testid="User-Name"><a href="/fan">Fan</a><a href="/fan/status/${id}">2h</a></div><div data-testid="tweetText">${text}</div>${extra}</article></div></div>`;

const home = `<!doctype html><html><head><title>Home / X</title></head><body style="background:#000;color:#fff">
  <main id="feed">
    ${tweet(1, 'no way the GTA 6 ending did that')}
    ${tweet(2, 'coffee then gym')}
    ${tweet(3, 'GTA 6 map is huge')}
    ${tweet(4, 'look at this', '<div data-testid="videoPlayer"><video id="clip" muted></video></div>')}
  </main>
</body></html>`;

const states = page => page.$$eval('[data-testid="cellInnerDiv"]', els => els.map(e => e.dataset.spoil6Label || ''));

test('covers GTA 6 posts on X and leaves the rest', async () => {
  const page = await open(context, 'https://x.com/home', home);
  await page.waitForSelector('[data-spoil6="hidden"]');
  assert.deepEqual(await states(page), ['Possible GTA 6 spoiler · Show', '', 'Mentions GTA 6 · Show', '']);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.spoil6Theme), 'dark');
});

test('covers new posts before they paint', async () => {
  const page = await open(context, 'https://x.com/home', home);
  await page.waitForSelector('[data-spoil6="hidden"]');
  const label = await page.evaluate(() => {
    document.querySelector('#feed').insertAdjacentHTML('beforeend',
      '<div data-testid="cellInnerDiv" id="late"><article data-testid="tweet"><div data-testid="tweetText">#GTAVI tonight</div></article></div>');
    return new Promise(done => requestAnimationFrame(() => done(document.querySelector('#late').dataset.spoil6Label)));
  });
  assert.equal(label, 'Mentions GTA 6 · Show');
});

test('covers a post when its text changes to GTA 6', async () => {
  const page = await open(context, 'https://x.com/home', home);
  await page.waitForSelector('[data-spoil6="hidden"]');
  await page.evaluate(() => { document.querySelectorAll('[data-testid="tweetText"]')[1].textContent = 'GTA 6 tonight'; });
  assert.equal((await states(page))[1], 'Mentions GTA 6 · Show');
});

test('clicking a cover shows the post without opening it', async () => {
  const page = await open(context, 'https://x.com/home', home);
  const first = page.locator('[data-testid="cellInnerDiv"]').first();
  await page.waitForSelector('[data-spoil6="hidden"]');
  await first.click();
  assert.equal(await first.getAttribute('data-spoil6'), null);
  assert.equal(page.url(), 'https://x.com/home');
});

test('videos inside covered posts stay paused', async () => {
  const page = await open(context, 'https://x.com/home', home);
  await page.waitForSelector('[data-spoil6="hidden"]');
  const paused = await page.evaluate(async () => {
    document.querySelectorAll('[data-testid="tweetText"]')[3].textContent = 'GTA 6 clip';
    const video = document.querySelector('#clip');
    video.play().catch(() => {});
    await new Promise(done => setTimeout(done, 50));
    return video.paused;
  });
  assert.equal(paused, true);
});
