import '../extension/src/sites.js';
import { launch } from '../tests/browser/helpers.mjs';

const [url, shot] = process.argv.slice(2);
const { hostname } = new URL(url);
const site = globalThis.spoil6.sites.find(s => s.hosts.some(h => hostname === h || hostname.endsWith(`.${h}`)));
const cardSel = site.cards.map(c => c.sel).join(',');

const context = await launch();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);

const report = await page.evaluate(sel => {
  const cards = [...document.querySelectorAll(sel)];
  const looksGta = el => /gta|grand theft|leonida|vice city|rockstar/i.test(el.textContent + ' ' + (el.querySelector('[aria-label]')?.getAttribute('aria-label') || ''));
  const inCover = el => el.closest('[data-spoil6="hidden"]');
  return {
    title: document.title,
    cards: cards.length,
    covered: document.querySelectorAll('[data-spoil6="hidden"]').length,
    gate: !!document.querySelector('spoil6-gate'),
    missed: cards.filter(el => looksGta(el) && !inCover(el)).slice(0, 8)
      .map(el => `${el.tagName.toLowerCase()}: ${el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90)}`),
    shown: cards.filter(el => !looksGta(el) && !inCover(el)).length,
  };
}, cardSel);

console.log(JSON.stringify(report, null, 2));
if (shot) await page.screenshot({ path: shot });
await context.close();
