import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../extension/src/terms.js';
import '../extension/src/match.js';

const S = globalThis.spoil6;
const base = { mode: 'all', blockWords: [], allowWords: [] };
const all = S.createMatcher(base);
const spoilersOnly = S.createMatcher({ ...base, mode: 'spoilers' });

test('finds GTA 6 however it is written', () => {
  for (const text of [
    'GTA 6 is finally here', 'GTA VI', 'gta vi looks unreal', 'GTAVI', '#GTA6', 'gta_6 clips', 'GTA-6',
    'Grand Theft Auto VI', 'grand theft auto 6', 'GTA six', '𝐆𝐓𝐀 𝟔 day', 'GTA Ⅵ', 'GTA 6️⃣',
    "GTA 6's map", 'playing gta6 tonight', 'G.T.A. 6',
  ]) assert.equal(all(text), 'topic', text);
});

test('finds the people and places from the trailers', () => {
  for (const text of [
    'Leonida looks huge', 'Vice City at night', '#ViceCity', 'Jason Duval', '#JasonDuval', 'Lucia and Jason',
    'Lucía Caminos', 'Dre Quan Priest', "Dre'Quan Priest", 'Boobie Ike', 'Rockstar Games just posted', '@RockstarGames',
  ]) assert.equal(all(text), 'topic', text);
});

test('counts plain GTA unless it means something else', () => {
  assert.equal(all('just bought GTA'), 'topic');
  assert.equal(all('GTA online weekly update'), 'topic');
  assert.equal(all('Toronto GTA housing prices'), null);
  assert.equal(all('looking for a GTA, our teaching assistant quit'), null);
  assert.equal(all('GTA 6 launch party in Toronto'), 'topic');
});

test('leaves normal posts alone', () => {
  for (const text of [
    'coffee then gym', 'rockstar energy drink', 'my friend Jason', 'Lucia is visiting', 'gtafans.net', 'the vice president',
    'agtA6', 'spoil6 is a browser extension',
  ]) assert.equal(all(text), null, text);
});

test('marks spoiler talk', () => {
  for (const text of [
    'The GTA 6 ending got me', '#GTA6Spoilers', '#gta6ending', '#GTAVIEnding', 'no way Jason Duval dies',
    'just beat GTA', '/r/gaming/comments/abc/gta_6_ending_explained/', 'GTA 6 final mission was crazy',
    'that GTA 6 mission with the boat',
  ]) assert.equal(all(text), 'spoiler', text);
});

test('only spoilers mode lets plain GTA 6 posts through', () => {
  assert.equal(spoilersOnly('GTA 6 map is huge'), null);
  assert.equal(spoilersOnly('GTA 6 ending explained'), 'spoiler');
  assert.equal(spoilersOnly('spoil6 hides GTA 6 posts'), null);
});

test('your words always hide and allow words always show', () => {
  const mine = S.createMatcher({ ...base, blockWords: ['brian', 'big twist'], allowWords: ['gta online'] });
  assert.equal(mine('brian is so funny'), 'yours');
  assert.equal(mine('that big twist though'), 'yours');
  assert.equal(mine('GTA Online weekly update'), null);
  assert.equal(mine('GTA 6 is out'), 'topic');
});

test('hints from the site count', () => {
  assert.equal(all('look at this', { topic: true }), 'topic');
  assert.equal(all('look at this', { topic: true, spoiler: true }), 'spoiler');
  assert.equal(spoilersOnly('look at this', { topic: true }), null);
});

test('knows the GTA subreddits', () => {
  for (const name of ['r/GTA6', 'r/gtavi', 'r/GTA', 'GTA6_', 'r/GrandTheftAutoVI', 'r/rockstargames'])
    assert.equal(S.isGtaSubreddit(name), true, name);
  for (const name of ['r/gaming', 'r/GTAV', 'r/toronto', 'r/rockstarenergy'])
    assert.equal(S.isGtaSubreddit(name), false, name);
});
