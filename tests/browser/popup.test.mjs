import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { launch, open, worker } from './helpers.mjs';

let context;
let feed;
let popup;

const cells = () => feed.$$eval('[data-testid="cellInnerDiv"]', els => els.map(e => e.dataset.spoil6Label || ''));
const settle = () => feed.waitForTimeout(700);

before(async () => {
  context = await launch();
  feed = await open(context, 'https://x.com/home', `<!doctype html><html><body>
    <div data-testid="cellInnerDiv"><article data-testid="tweet">GTA 6 ending explained</article></div>
    <div data-testid="cellInnerDiv"><article data-testid="tweet">GTA 6 map is huge</article></div>
    <div data-testid="cellInnerDiv"><article data-testid="tweet">coffee then gym</article></div>
  </body></html>`);
  await feed.waitForSelector('[data-spoil6="hidden"]');
  const id = new URL((await worker(context)).url()).host;
  popup = await context.newPage();
  await popup.goto(`chrome-extension://${id}/popup/popup.html`);
});
after(() => context?.close());

test('starts by covering every GTA 6 post', async () => {
  assert.deepEqual(await cells(), ['Possible GTA 6 spoiler · Show', 'Mentions GTA 6 · Show', '']);
});

test('Only spoilers lets plain GTA 6 posts through', async () => {
  await popup.getByText('Only spoilers').click();
  await settle();
  assert.deepEqual(await cells(), ['Possible GTA 6 spoiler · Show', '', '']);
});

test('your own words get covered too', async () => {
  await popup.locator('#blockWords').fill('coffee');
  await settle();
  assert.equal((await cells())[2], 'Has a word you blocked · Show');
});

test('pausing shows everything until you resume', async () => {
  await popup.getByText('Pause for 1 hour').click();
  await settle();
  assert.deepEqual(await cells(), ['', '', '']);
  assert.match(await popup.locator('#status').textContent(), /^Paused until/);
  await popup.getByText('Resume now').click();
  await settle();
  assert.equal((await cells())[0], 'Possible GTA 6 spoiler · Show');
});

test('the main switch turns it off', async () => {
  await popup.locator('#enabled').uncheck();
  await settle();
  assert.deepEqual(await cells(), ['', '', '']);
  assert.equal(await popup.locator('#status').textContent(), 'Off. Spoilers can show.');
});
