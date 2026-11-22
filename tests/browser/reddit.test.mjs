import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open } from './helpers.mjs';

let context;
before(async () => { context = await launch(); });
after(() => context?.close());

const post = (sub, title, body = '') => `
  <article aria-label="${title}"><shreddit-post post-title="${title}" subreddit-prefixed-name="r/${sub}" permalink="/r/${sub}/comments/${sub}1/x/">
    <a slot="title" href="/r/${sub}/comments/${sub}1/x/">${title}</a><div slot="text-body">${body}</div>
  </shreddit-post></article><hr>`;

const feed = `<!doctype html><html><head><title>Reddit</title></head><body>
  ${post('GTA6', 'Day 3 thoughts', 'no notes')}
  ${post('cats', 'My cat at 3am')}
  ${post('gaming', 'GTA 6 ending explained')}
</body></html>`;

const labels = page => page.$$eval('article', els => els.map(e => e.dataset.spoil6Label || ''));

test('covers posts from GTA subreddits and posts about GTA 6', async () => {
  const page = await open(context, 'https://www.reddit.com/', feed);
  await page.waitForSelector('[data-spoil6="hidden"]');
  assert.deepEqual(await labels(page), ['Mentions GTA 6 · Show', '', 'Possible GTA 6 spoiler · Show']);
});

test('covers a GTA 6 comment but not the replies under it', async () => {
  const page = await open(context, 'https://www.reddit.com/r/cats/comments/c1/my_cat/', `<!doctype html><html><head><title>My cat : r/cats</title></head><body>
    ${post('cats', 'My cat at 3am')}
    <shreddit-comment-tree>
      <shreddit-comment author="a"><div slot="comment"><p>the GTA 6 ending was wild</p></div>
        <shreddit-comment author="b"><div slot="comment"><p>cute cat though</p></div></shreddit-comment>
      </shreddit-comment>
    </shreddit-comment-tree>
  </body></html>`);
  await page.waitForSelector('[data-spoil6="hidden"]');
  const comments = await page.$$eval('[slot="comment"]', els => els.map(e => e.dataset.spoil6 || ''));
  assert.deepEqual(comments, ['hidden', '']);
});

test('covers GTA 6 posts on old Reddit', async () => {
  const page = await open(context, 'https://old.reddit.com/', `<!doctype html><html><head><title>reddit</title></head><body>
    <div class="thing link" data-subreddit="GTA6"><a class="title" href="/r/GTA6/comments/a/x/">Day 3 thoughts</a></div>
    <div class="thing link" data-subreddit="cats"><a class="title" href="/r/cats/comments/b/y/">My cat at 3am</a></div>
  </body></html>`);
  await page.waitForSelector('[data-spoil6="hidden"]');
  const rows = await page.$$eval('.thing', els => els.map(e => e.dataset.spoil6 || ''));
  assert.deepEqual(rows, ['hidden', '']);
});
