(() => {
  const S = globalThis.spoil6;
  const site = S.sites.find(s => s.hosts.some(h => location.hostname === h || location.hostname.endsWith(`.${h}`)));
  if (!site) return;

  const LABELS = { topic: 'Mentions GTA 6', spoiler: 'Possible GTA 6 spoiler', yours: 'Has a word you blocked' };
  const GATE_TITLES = { topic: 'This page is about GTA 6', spoiler: 'This page might spoil GTA 6', yours: 'This page has a word you blocked' };
  const STAR = (x, y, r) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, rgba(255, 255, 255, 0.85), transparent)`;
  const GATE_CSS = `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      overflow: hidden;
      background:
        ${STAR(12, 18, 1.5)}, ${STAR(27, 7, 1)}, ${STAR(41, 26, 1.5)}, ${STAR(58, 11, 1)},
        ${STAR(70, 24, 1.5)}, ${STAR(84, 9, 1)}, ${STAR(93, 21, 1.5)},
        linear-gradient(180deg, #0d0524 0%, #250b52 34%, #5e1a7c 56%, #b02d82 68%, #ff5f7e 78%);
      color: #fff4fb;
      font: 15px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .sun {
      position: absolute;
      top: 78%;
      left: 50%;
      width: 42vmin;
      aspect-ratio: 1;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, #ffe58f 8%, #ff9c5b 30%, #ff4f9a 50%);
      mask-image: linear-gradient(180deg, #000 0 31%, transparent 31% 34%, #000 34% 39%, transparent 39% 42.5%, #000 42.5% 46%, transparent 46%);
    }
    .sea {
      position: absolute;
      inset: 78% 0 0;
      background: linear-gradient(180deg, #3b0f63, #12052a 70%);
    }
    .sea::before {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      width: 48vmin;
      height: 100%;
      transform: translateX(-50%);
      background: repeating-linear-gradient(180deg, rgba(255, 150, 130, 0.65) 0 2px, transparent 2px 11px);
      mask-image: radial-gradient(50% 100% at 50% 0, #000 15%, transparent 100%);
    }
    .palm { position: absolute; bottom: 0; width: auto; height: 62vh; fill: #13052b; }
    .left { left: -3vh; }
    .right { right: -2vh; height: 46vh; transform: scaleX(-1); }
    .card {
      position: relative;
      width: min(360px, calc(100vw - 48px));
      margin-bottom: 22vh;
      padding: 28px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 22px;
      background: rgba(22, 8, 48, 0.66);
      box-shadow: 0 24px 70px rgba(8, 0, 24, 0.55);
      backdrop-filter: blur(16px);
      text-align: center;
    }
    .brand { margin: 0 0 10px; color: #ff8fd0; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; }
    h1 { margin: 0 0 6px; font-size: 21px; line-height: 1.25; }
    .note { margin: 0 0 22px; color: #dcc6f2; }
    .actions { display: flex; gap: 10px; }
    button {
      flex: 1;
      padding: 11px 14px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      color: inherit;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    button:hover { background: rgba(255, 255, 255, 0.12); }
    .back { border-color: transparent; background: linear-gradient(90deg, #ff4fa8, #ff8a5c); color: #1c0733; }
    .back:hover { background: linear-gradient(90deg, #ff66b5, #ff9a70); }
    button:focus-visible { outline: 2px solid #3ee6e6; outline-offset: 2px; }`;
  const PALM = side => `<svg class="palm ${side}" viewBox="0 0 240 420" aria-hidden="true">
    <path d="M100 420C108 320 122 200 146 92L156 94C134 200 122 320 120 420Z"/>
    <path d="M150 88Q96 50 30 100Q96 68 150 94Z"/><path d="M150 92Q98 98 70 160Q108 108 150 98Z"/>
    <path d="M150 88Q206 46 238 110Q198 68 150 94Z"/><path d="M150 92Q204 104 216 168Q190 112 150 98Z"/>
    <path d="M150 88Q118 28 70 34Q122 46 148 92Z"/><path d="M150 88Q186 24 230 50Q182 42 154 92Z"/>
    <path d="M148 94Q134 130 112 168Q142 128 156 96Z"/><circle cx="146" cy="100" r="5"/><circle cx="157" cy="102" r="5"/>
  </svg>`;
  const HOVER = ['mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousemove', 'pointerover', 'pointerout', 'pointerenter', 'pointerleave', 'pointermove'];
  const root = document.documentElement;
  const cardSel = site.cards.map(c => c.sel).join(',');

  let settings = S.defaults;
  let on = true;
  let match = S.createMatcher(settings);
  let seen = new WeakMap();
  const revealedLinks = new Set();
  const revealedEls = new WeakSet();
  const shownPages = new Set();
  const pending = new Set();
  let gate;
  let held;
  let lastPage = '';

  const configOf = el => site.cards.find(c => el.matches(c.sel));

  const outermost = el => {
    for (let up = el.parentElement?.closest(cardSel); up; up = up.parentElement?.closest(cardSel)) el = up;
    return el;
  };

  const keyOf = href => {
    const url = new URL(href, location.href);
    return url.pathname.replace(/\/$/, '') + url.search;
  };

  const linkOf = el => {
    const href = (el.matches(S.linkSel) ? el : el.querySelector(S.linkSel))?.getAttribute('href');
    return href && keyOf(href);
  };

  const isRevealed = el => {
    const link = linkOf(el);
    return link ? revealedLinks.has(link) : revealedEls.has(el);
  };

  let countTimer;
  const hiddenCount = () => document.querySelectorAll('[data-spoil6="hidden"]').length + (gate?.host.isConnected ? 1 : 0);
  const changed = () => {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => {
      try {
        chrome.runtime.sendMessage({ type: 'count', count: hiddenCount() }).catch(() => {});
      } catch {}
    }, 300);
  };

  function hide(el, reason) {
    if (el.dataset.spoil6 !== 'hidden') {
      el.dataset.spoil6 = 'hidden';
      if (getComputedStyle(el).position === 'static') el.dataset.spoil6Pos = '';
      for (const video of el.querySelectorAll('video')) video.pause();
      changed();
    }
    const label = `${LABELS[reason]} · Show`;
    if (el.dataset.spoil6Label !== label) el.dataset.spoil6Label = label;
  }

  function unhide(el) {
    if (el.dataset.spoil6 === undefined) return;
    delete el.dataset.spoil6;
    delete el.dataset.spoil6Pos;
    delete el.dataset.spoil6Label;
    changed();
  }

  function reveal(el) {
    const link = linkOf(el);
    if (link) revealedLinks.add(link);
    revealedEls.add(el);
    unhide(el);
  }

  function check(card) {
    const config = configOf(card);
    if (!config) return;
    const text = config.text ? config.text(card) : S.cardText(card);
    if (seen.get(card) === text) return;
    seen.set(card, text);
    const target = config.target ? config.target(card) : card;
    const reason = on ? match(text, config.hint?.(card)) : null;
    if (reason && !isRevealed(target)) hide(target, reason);
    else unhide(target);
  }

  function buildGate() {
    const host = document.createElement('spoil6-gate');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${GATE_CSS}</style>
      <div class="sun"></div>
      <div class="sea"></div>
      ${PALM('left')}${PALM('right')}
      <div class="card" role="dialog" aria-modal="true" aria-labelledby="title">
        <p class="brand">spoil6</p>
        <h1 id="title"></h1>
        <p class="note">Stopped here so you can decide.</p>
        <div class="actions">
          <button class="back">Go back</button>
          <button class="show">Show page</button>
        </div>
      </div>`;
    shadow.querySelector('.back').addEventListener('click', () => (history.length > 1 ? history.back() : location.assign('/')));
    shadow.querySelector('.show').addEventListener('click', () => {
      const key = keyOf(location.href);
      shownPages.add(key);
      revealedLinks.add(key);
      rescan();
    });
    return { host, title: shadow.querySelector('h1'), back: shadow.querySelector('.back') };
  }

  function openGate(reason) {
    gate ??= buildGate();
    gate.title.textContent = GATE_TITLES[reason];
    if (gate.host.isConnected) return;
    root.append(gate.host);
    gate.back.focus();
    for (const video of document.querySelectorAll('video')) video.pause();
    changed();
  }

  function closeGate() {
    if (!gate?.host.isConnected) return;
    gate.host.remove();
    changed();
  }

  const pageTitle = () => (site.pageTitle ? site.pageTitle() : document.title);

  function checkPage() {
    const key = keyOf(location.href);
    const title = pageTitle();
    const sig = `${on}|${key}|${title}`;
    if (sig === lastPage) return;
    lastPage = sig;
    if (title === null) return;
    const reason = on && site.detail?.(location.pathname) && !shownPages.has(key)
      ? match(`${title} ${location.pathname}`)
      : null;
    if (!reason) closeGate();
    else openGate(reason);
    if (!reason && held?.key === key) held.video.play().catch(() => {});
    held = null;
  }

  function flush() {
    for (const el of pending) if (el.isConnected) check(outermost(el));
    pending.clear();
    checkPage();
  }

  function rescan() {
    seen = new WeakMap();
    lastPage = '';
    for (const el of document.querySelectorAll('[data-spoil6]')) unhide(el);
    for (const el of document.querySelectorAll(cardSel)) pending.add(el);
    flush();
  }

  const observer = new MutationObserver(records => {
    for (const r of records) {
      const node = r.type === 'characterData' ? r.target.parentElement : r.target;
      const card = node?.closest?.(cardSel);
      if (card) pending.add(card);
      for (const n of r.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches(cardSel)) pending.add(n);
        for (const el of n.querySelectorAll(cardSel)) pending.add(el);
      }
    }
    flush();
  });

  const onPointer = e => {
    const el = e.target.closest?.('[data-spoil6="hidden"]');
    if (!el) return;
    e.stopImmediatePropagation();
    if (HOVER.includes(e.type)) return;
    e.preventDefault();
    if (e.type === 'click') reveal(el);
  };
  for (const type of ['click', 'auxclick', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', ...HOVER])
    window.addEventListener(type, onPointer, true);

  document.addEventListener('play', e => {
    checkPage();
    const unknown = on && site.detail?.(location.pathname) && pageTitle() === null;
    if (unknown) held = { video: e.target, key: keyOf(location.href) };
    if (unknown || gate?.host.isConnected || e.target.closest('[data-spoil6="hidden"]')) e.target.pause();
  }, true);
  addEventListener('popstate', checkPage);

  function readTheme() {
    const rgb = el => el && getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number);
    const bg = [rgb(document.body), rgb(root)].find(c => c?.length >= 3 && (c[3] ?? 1) > 0);
    const dark = bg ? 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2] < 128 : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.spoil6Theme = dark ? 'dark' : 'light';
  }

  let resumeTimer;
  function apply(next) {
    settings = next;
    match = S.createMatcher(next);
    on = S.isOn(next, site.id);
    root.dataset.spoil6Style = next.style;
    readTheme();
    clearTimeout(resumeTimer);
    const wait = next.pausedUntil - Date.now();
    if (next.enabled && wait > 0) resumeTimer = setTimeout(() => apply(settings), wait + 100);
    rescan();
  }

  root.dataset.spoil6Style = settings.style;
  observer.observe(document, { childList: true, subtree: true, characterData: true });
  S.loadSettings().then(apply);
  S.onSettings(apply);
  document.addEventListener('DOMContentLoaded', readTheme);
  setInterval(readTheme, 3000);

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'status') reply({ site: site.id, name: site.name, on, count: hiddenCount() });
  });
})();
