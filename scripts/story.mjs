import { readFile, writeFile } from 'node:fs/promises';
import '../extension/src/terms.js';
import '../extension/src/match.js';

// Builds extension/src/story.js from the GTA Wiki's story mission list.
// It only ever prints counts, never a mission or character name, so running it can't spoil anything.

const S = globalThis.spoil6;
const API = 'https://gta.fandom.com/api.php';
const LIST = 'Missions in Grand Theft Auto VI';
const CHARACTERS = 'Category:Characters in GTA VI';

const fail = message => Object.assign(new Error(message), { safe: true });

const get = async params => {
  const res = await fetch(`${API}?${new URLSearchParams({ format: 'json', formatversion: 2, ...params })}`, {
    headers: { 'User-Agent': 'spoil6-story-builder' },
  });
  if (!res.ok) throw fail(`The wiki answered ${res.status}.`);
  return res.json();
};

const clean = title => title.replace(/\s*\([^)]*\)\s*$/, '').trim();

// First names and one-word nicknames only count when they aren't everyday words, so "Real" from a name doesn't flag every post.
const everyday = new Set((await readFile('/usr/share/dict/words', 'utf8').catch(() => '')).split('\n').filter(w => /^[a-z]+$/.test(w)));
const nameWord = word => everyday.size && word.length > 2 && /^\p{Lu}/u.test(word) && !everyday.has(word.toLowerCase()) ? word : '';
const nickname = label => (/\s/.test(label) ? (/^\p{Lu}/u.test(label) ? label : '') : nameWord(label));

const linksIn = text => [...text.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g)]
  .map(m => ({ target: m[1].trim(), label: (m[2] ?? m[1]).replace(/'{2,}/g, '').trim() }));

async function storyRows() {
  const page = (await get({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: LIST })).query.pages[0];
  const text = page.revisions?.[0]?.slots.main.content;
  if (!text) throw fail('The mission list page is missing.');
  const sections = text.split(/^==[^=].*==\s*$/m);
  const heading = text.match(/^==([^=].*)==\s*$/m)?.[1] ?? '';
  if (!/story/i.test(heading)) throw fail('The first section of the mission list is no longer the story.');

  // Names in a chapter's intro text count from the chapter's last mission, since the intro covers the whole chapter.
  const rows = [];
  let row = null;
  let intro = linksIn(sections[0]);
  const endChapter = () => {
    if (rows.length) rows.at(-1).links.push(...intro);
    intro = [];
  };
  for (const line of sections[1].split('\n')) {
    const name = line.match(/^\|\s*'''\[\[([^\]]+)\]\]'''/);
    if (/^===/.test(line)) {
      if (rows.length) endChapter();
    } else if (name) {
      const [target, label] = name[1].split('|').map(s => s.trim());
      row = { name: label ?? clean(target), target, links: [] };
      rows.push(row);
    } else if (/^\|[-}]/.test(line)) {
      row = null;
    } else {
      (row ? row.links : intro).push(...linksIn(line));
    }
  }
  endChapter();
  return rows;
}

async function characters() {
  const titles = new Set();
  let more = {};
  do {
    const data = await get({ action: 'query', list: 'categorymembers', cmtitle: CHARACTERS, cmnamespace: 0, cmlimit: 'max', ...more });
    for (const member of data.query.categorymembers) titles.add(member.title);
    more = data.continue ?? null;
  } while (more);
  return titles;
}

async function canonical(targets) {
  const names = new Map();
  for (let i = 0; i < targets.length; i += 50) {
    const batch = targets.slice(i, i + 50);
    const { query } = await get({ action: 'query', redirects: 1, titles: batch.join('|') });
    const normalized = new Map((query.normalized ?? []).map(n => [n.from, n.to]));
    const redirects = new Map((query.redirects ?? []).map(r => [r.from, r.to]));
    for (const target of batch) {
      const title = normalized.get(target) ?? target;
      names.set(target, redirects.get(title) ?? title);
    }
  }
  return names;
}

try {
  const rows = await storyRows();
  const people = await characters();
  const names = await canonical([...new Set(rows.flatMap(row => row.links.map(link => link.target)))]);

  const missions = rows.map(row => {
    const met = row.links.filter(link => people.has(names.get(link.target)));
    return {
      name: row.name,
      terms: [
        clean(row.target),
        ...met.flatMap(link => {
          const full = clean(names.get(link.target));
          return [full, clean(link.target), nickname(link.label), full.includes(' ') ? nameWord(full.split(/\s+/)[0]) : ''];
        }),
      ],
      solo: met.map(link => clean(names.get(link.target))).filter(name => name.split(/\s+/).length > 1),
    };
  });

  const story = S.makeStory(missions);
  await writeFile(new URL('../extension/src/story.js', import.meta.url), `(() => {
  const S = (globalThis.spoil6 ??= {});

  // Made by scripts/story.mjs from the GTA Wiki's story mission list. Every name is a scrambled code, so nothing here spoils the story.
  S.story = ${JSON.stringify(story)};
})();
`);
  console.log(`Saved ${story.missions} story missions and ${Object.keys(story.terms).length} story names (${Object.keys(story.solo).length} full character names).`);
} catch (e) {
  console.error(`Couldn't build the story list. ${e.safe ? e.message : e.name}`);
  process.exitCode = 1;
}
