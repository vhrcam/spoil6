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
  const subreddit = new RegExp(T.subreddit, 'i');

  S.isGtaSubreddit = name => subreddit.test(name.trim().replace(/^r\//i, ''));

  S.createMatcher = settings => {
    const block = compile(words(settings.blockWords));
    const allow = compile(words(settings.allowWords));

    return (raw, hint = {}) => {
      const text = S.prepare(raw);
      if (allow?.test(text)) return null;
      if (block?.test(text)) return 'yours';
      const about = hint.topic || gta6.test(text) || (series.test(text) && !notTheGame.test(text));
      if (!about) return null;
      if (hint.spoiler || spoiler.test(text)) return 'spoiler';
      return settings.mode === 'all' ? 'topic' : null;
    };
  };
})();
