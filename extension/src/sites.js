(() => {
  const S = (globalThis.spoil6 ??= {});

  S.linkSel = [
    'a[href*="/status/"]', 'a[href*="watch?v="]', 'a[href*="/shorts/"]', 'a[href*="/comments/"]',
    'a[href*="/video/"]', 'a[href*="/p/"]', 'a[href*="/reel/"]',
  ].join(',');

  const attr = (el, name) => el.getAttribute(name) || '';
  const startUrl = globalThis.location?.href;

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
      id: 'reddit',
      name: 'Reddit',
      hosts: ['reddit.com'],
      cards: [
        {
          sel: 'shreddit-post',
          target: el => el.closest('article') || el,
          text: el => `${attr(el, 'post-title')} ${attr(el, 'subreddit-prefixed-name')} ${S.cardText(el)}`,
          hint: el => ({ topic: S.isGtaSubreddit(attr(el, 'subreddit-prefixed-name')), spoiler: el.hasAttribute('spoiler') }),
        },
        {
          sel: '.thing.link',
          hint: el => ({ topic: S.isGtaSubreddit(attr(el, 'data-subreddit')), spoiler: el.classList.contains('spoiler') }),
        },
        { sel: 'shreddit-ad-post, shreddit-comment > [slot="comment"], .thing.comment > .entry' },
      ],
      detail: path => path.includes('/comments/'),
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
      pageTitle: () => {
        if (location.pathname !== '/watch') return document.title;
        const id = document.querySelector('ytd-watch-flexy')?.getAttribute('video-id');
        const fresh = id ? id === new URLSearchParams(location.search).get('v') : location.href === startUrl;
        return fresh ? document.title : null;
      },
    },
  ];
})();
