import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open, worker } from './helpers.mjs';

let context;
before(async () => { context = await launch(); });
after(() => context?.close());

test('the toolbar icon shows how many things are hidden', async () => {
  const page = await open(context, 'https://x.com/home', `<!doctype html><html><body>
    <div data-testid="cellInnerDiv"><article data-testid="tweet">GTA 6 is out</article></div>
    <div data-testid="cellInnerDiv"><article data-testid="tweet">GTA VI tonight</article></div>
    <div data-testid="cellInnerDiv"><article data-testid="tweet">coffee</article></div>
  </body></html>`);
  await page.waitForSelector('[data-spoil6="hidden"]');
  await page.waitForTimeout(600);
  const sw = await worker(context);
  const badges = await sw.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    return Promise.all(tabs.map(tab => chrome.action.getBadgeText({ tabId: tab.id })));
  });
  assert.ok(badges.includes('2'), `badges were ${JSON.stringify(badges)}`);
});
