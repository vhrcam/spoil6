(() => {
  const S = (globalThis.spoil6 ??= {});

  S.defaults = {
    enabled: true,
    pausedUntil: 0,
    mode: 'all',
    progress: 0,
    sites: { x: true, reddit: true, youtube: true, tiktok: true, instagram: true },
    blockWords: [],
    allowWords: [],
  };

  const merge = saved => ({ ...S.defaults, ...saved, sites: { ...S.defaults.sites, ...saved?.sites } });

  S.loadSettings = async () => merge((await chrome.storage.sync.get('settings')).settings);

  S.saveSettings = async patch => {
    const next = { ...(await S.loadSettings()), ...patch };
    await chrome.storage.sync.set({ settings: next });
    return next;
  };

  S.onSettings = fn => chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) fn(merge(changes.settings.newValue));
  });

  S.isOn = (settings, siteId) => settings.enabled && settings.pausedUntil <= Date.now() && settings.sites[siteId];
})();
