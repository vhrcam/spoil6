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
    {
      id: 'youtube',
      name: 'YouTube',
      hosts: ['youtube.com'],
      cards: [
        {
          sel: [
            'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer', 'ytd-grid-video-renderer',
            'ytd-playlist-renderer', 'ytd-compact-playlist-renderer', 'ytd-radio-renderer', 'ytd-compact-radio-renderer',
            'ytd-reel-item-renderer', 'ytm-shorts-lockup-view-model', 'ytm-shorts-lockup-view-model-v2', 'yt-lockup-view-model',
            'ytd-channel-renderer', 'ytd-post-renderer', 'ytd-comment-view-model', 'ytd-comment-renderer',
            'ytd-playlist-panel-video-renderer', 'ytd-notification-renderer', 'ytd-movie-renderer', 'ytd-ad-slot-renderer',
            'ytd-universal-watch-card-renderer', '.ytp-videowall-still', '.ytp-ce-element',
            '.ytp-autonav-endscreen-upnext-container', '.ytp-suggestion-link',
            'ytm-rich-item-renderer', 'ytm-video-with-context-renderer', 'ytm-compact-video-renderer',
            'ytm-reel-item-renderer', 'ytm-comment-renderer',
          ].join(','),
        },
      ],
      detail: path => path === '/watch' || path.startsWith('/shorts/'),
    },
  ];
})();
