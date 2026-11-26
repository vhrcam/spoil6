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

test('where you are takes a mission number and can be cleared', async () => {
  await popup.locator('#progress').fill('2');
  await popup.locator('#progress').press('Enter');
  await settle();
  assert.match(await popup.locator('#progressHint').textContent(), /^Past mission 2\./);
  await popup.locator('#clearProgress').click();
  await settle();
  assert.match(await popup.locator('#progressHint').textContent(), /^Type the last story mission/);
});

test('where you are says when it can\'t find a mission name', async () => {
  await popup.locator('#progress').fill('not a mission name at all');
  await popup.locator('#progress').press('Enter');
  assert.match(await popup.locator('#progressHint').textContent(), /^Couldn't find that story mission/);
  await popup.locator('#progress').fill('');
  assert.match(await popup.locator('#progressHint').textContent(), /^Type the last story mission/);
});

test('the main switch turns it off', async () => {
  await popup.locator('#enabled').uncheck();
  await settle();
  assert.deepEqual(await cells(), ['', '', '']);
  assert.equal(await popup.locator('#status').textContent(), 'Off. Spoilers can show.');
});
