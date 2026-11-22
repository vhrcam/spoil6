import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open } from './helpers.mjs';

let context;
before(async () => { context = await launch(); });
after(() => context?.close());

const statusPage = `<!doctype html><html><head><title>Fan on X: "the GTA 6 ending though" / X</title></head><body>
  <div data-testid="cellInnerDiv" id="main"><article data-testid="tweet"><a href="/fan/status/1">2h</a><div data-testid="tweetText">the GTA 6 ending though</div></article></div>
  <div data-testid="cellInnerDiv" id="reply"><article data-testid="tweet"><a href="/pal/status/2">1h</a><div data-testid="tweetText">GTA 6 final mission ruined me</div></article></div>
  <video id="clip" muted></video>
</body></html>`;

test('stops on a GTA 6 page before anything shows', async () => {
  const page = await open(context, 'https://x.com/fan/status/1', statusPage);
  await page.waitForSelector('spoil6-gate');
  assert.equal(await page.locator('spoil6-gate h1').textContent(), 'This page might spoil GTA 6');
  const paused = await page.evaluate(async () => {
    const video = document.querySelector('#clip');
    video.play().catch(() => {});
    await new Promise(done => setTimeout(done, 50));
    return video.paused;
  });
  assert.equal(paused, true);
});

test('Show page opens the main post and keeps the rest covered', async () => {
  const page = await open(context, 'https://x.com/fan/status/1', statusPage);
  await page.locator('spoil6-gate button.show').click();
  assert.equal(await page.locator('spoil6-gate').count(), 0);
  assert.equal(await page.locator('#main').getAttribute('data-spoil6'), null);
  assert.equal(await page.locator('#reply').getAttribute('data-spoil6'), 'hidden');
});

test('pages that are not about GTA 6 open normally', async () => {
  const page = await open(context, 'https://www.reddit.com/r/cats/comments/c1/my_cat_at_3am/',
    '<!doctype html><html><head><title>My cat at 3am : r/cats</title></head><body><p>cat</p></body></html>');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('spoil6-gate').count(), 0);
});

test('the Reddit link alone is enough to stop a thread', async () => {
  const page = await open(context, 'https://www.reddit.com/r/gaming/comments/g1/gta_6_ending_explained/',
    '<!doctype html><html><head><title>Reddit</title></head><body><p>thread</p></body></html>');
  await page.waitForSelector('spoil6-gate');
  assert.equal(await page.locator('spoil6-gate h1').textContent(), 'This page might spoil GTA 6');
});
