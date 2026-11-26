(() => {
  const S = (globalThis.spoil6 ??= {});
  const T = S.terms;

  const normalize = s => s
    .normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[​-‍⁠﻿]/g, '')
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');

  const splitTag = tag => tag
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{N})(\p{L})/gu, '$1 $2');

  S.prepare = raw => {
    const tags = [...raw.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(m => splitTag(m[1]));
    return normalize(`${raw} ${tags.join(' ')}`);
  };

  const hash = s => {
    let a = 0xdeadbeef ^ 6;
    let b = 0x41c6ce57 ^ 6;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      a = Math.imul(a ^ c, 2654435761);
      b = Math.imul(b ^ c, 1597334677);
    }
    a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909);
    b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909);
    return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36);
  };

  const tokens = text => text.replace(/'s(?![\p{L}\p{N}])/gu, '').replace(/'/g, '').split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  S.storyKey = raw => hash(tokens(S.prepare(raw)).join(' '));

  S.makeStory = missions => {
    const story = { missions: missions.length, longest: 1, names: {}, terms: {}, solo: {} };
    const add = (map, raw, n) => {
      const words = tokens(S.prepare(raw));
      if (!words.length) return;
      const key = hash(words.join(' '));
      map[key] ??= n;
      story.longest = Math.max(story.longest, words.length);
    };
    missions.forEach(({ name, terms = [], solo = [] }, i) => {
      add(story.names, name, i + 1);
      for (const term of [name, ...terms, ...solo]) add(story.terms, term, i + 1);
      for (const term of solo) add(story.solo, term, i + 1);
    });
    return story;
  };

  const storyHits = (text, at) => {
    const { terms, solo, longest } = S.story;
    const words = tokens(text);
    const hits = { ahead: false, known: false, solo: false };
    for (let i = 0; i < words.length; i++) {
      let gram = '';
      for (let n = 0; n < longest && i + n < words.length; n++) {
        gram = n ? `${gram} ${words[i + n]}` : words[i];
        const key = hash(gram);
        if (!terms[key]) continue;
        if (terms[key] > at) hits.ahead = true;
        else hits.known = true;
        if (solo[key]) hits.solo = true;
      }
    }
    return hits;
  };

  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const termPattern = term => {
    const words = normalize(term).trim().split(' ').filter(Boolean).map(w => escape(w).replace(/'/g, "[' ]?"));
    if (!words.length) return null;
    const head = /^[\p{L}\p{N}]/u.test(words[0]) ? '(?<![\\p{L}\\p{N}])' : '';
    const tail = /\p{N}$/u.test(words.at(-1)) ? '(?!\\p{N})' : "(?:'?s)?(?![\\p{L}\\p{N}])";
    return head + words.join("[\\s'.\\-]*") + tail;
  };

  const compile = parts => {
    const list = parts.filter(Boolean);
    return list.length ? new RegExp(list.join('|'), 'u') : null;
  };
  const words = list => list.map(termPattern);

  const gta6 = compile([T.gta6, ...words(T.topic)]);
  const series = new RegExp(T.series, 'u');
  const notTheGame = compile(words(T.notTheGame));
  const spoiler = compile(words(T.spoiler));
  const spoilerPastMissions = compile(words(T.spoiler.filter(w => w !== 'mission')));
  const subreddit = new RegExp(T.subreddit, 'i');

  S.isGtaSubreddit = name => subreddit.test(name.trim().replace(/^r\//i, ''));

  S.createMatcher = settings => {
    const block = compile(words(settings.blockWords));
    const allow = compile(words(settings.allowWords));
    const at = S.story?.missions && settings.progress > 0 ? settings.progress : 0;
    const loosen = at > 0 && at < S.story?.missions;

    return (raw, hint = {}) => {
      const text = S.prepare(raw);
      if (allow?.test(text)) return null;
      if (block?.test(text)) return 'yours';
      const story = at ? storyHits(text, at) : {};
      const about = hint.topic || gta6.test(text) || (series.test(text) && !notTheGame.test(text)) || story.solo;
      if (!about) return null;
      if (story.ahead) return 'later';
      if (hint.spoiler || (loosen && story.known ? spoilerPastMissions : spoiler).test(text)) return 'spoiler';
      return settings.mode === 'all' ? 'topic' : null;
    };
  };
})();
