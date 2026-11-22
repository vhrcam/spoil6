(() => {
  const S = globalThis.spoil6;
  const site = S.sites.find(s => s.hosts.some(h => location.hostname === h || location.hostname.endsWith(`.${h}`)));
  if (!site) return;

  const LABELS = { topic: 'Mentions GTA 6', spoiler: 'Possible GTA 6 spoiler', yours: 'Has a word you blocked' };
  const HOVER = ['mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousemove', 'pointerover', 'pointerout', 'pointerenter', 'pointerleave', 'pointermove'];
  const root = document.documentElement;
  const cardSel = site.cards.map(c => c.sel).join(',');

  let settings = S.defaults;
  let on = true;
  let match = S.createMatcher(settings);
  let seen = new WeakMap();
  const revealedLinks = new Set();
  const revealedEls = new WeakSet();
  const pending = new Set();

  const configOf = el => site.cards.find(c => el.matches(c.sel));

  const outermost = el => {
    for (let up = el.parentElement?.closest(cardSel); up; up = up.parentElement?.closest(cardSel)) el = up;
    return el;
  };

  const linkOf = el => (el.matches(S.linkSel) ? el : el.querySelector(S.linkSel))?.getAttribute('href');

  const isRevealed = el => {
    const link = linkOf(el);
    return link ? revealedLinks.has(link) : revealedEls.has(el);
  };

  let countTimer;
  const hiddenCount = () => document.querySelectorAll('[data-spoil6="hidden"]').length;
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

  function flush() {
    for (const el of pending) if (el.isConnected) check(outermost(el));
    pending.clear();
  }

  function rescan() {
    seen = new WeakMap();
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
    if (e.target.closest('[data-spoil6="hidden"]')) e.target.pause();
  }, true);

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
