(() => {
  const S = (globalThis.spoil6 ??= {});

  S.linkSel = [
    'a[href*="/status/"]', 'a[href*="watch?v="]', 'a[href*="/shorts/"]', 'a[href*="/comments/"]',
    'a[href*="/video/"]', 'a[href*="/p/"]', 'a[href*="/reel/"]',
  ].join(',');

  S.cardText = el => {
    const bits = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) bits.push(walker.currentNode.nodeValue);
    for (const e of [el, ...el.querySelectorAll('[aria-label], [title], img[alt]')].slice(0, 60))
      bits.push(e.getAttribute('aria-label'), e.getAttribute('title'), e.getAttribute('alt'));
    return bits.filter(Boolean).join(' ');
  };

  S.sites = [
    {
      id: 'x',
      name: 'X',
      hosts: ['x.com', 'twitter.com'],
      cards: [
        { sel: '[data-testid="cellInnerDiv"], article[data-testid="tweet"], [data-testid="trend"], [data-testid="UserCell"]' },
      ],
      detail: path => /\/status\/\d+/.test(path),
    },
  ];
})();
