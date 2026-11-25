const S = globalThis.spoil6;
const $ = id => document.getElementById(id);

const HINTS = {
  all: 'Covers anything that mentions GTA 6 or its characters and places.',
  spoilers: 'Covers GTA 6 posts about the story, missions, deaths or the ending.',
};

let settings;
let page = null;

const words = text => [...new Set(text.split(/[\n,]/).map(w => w.trim()).filter(Boolean))];
const clock = ms => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

function statusText() {
  if (!settings.enabled) return 'Off. Spoilers can show.';
  if (settings.pausedUntil > Date.now()) return `Paused until ${clock(settings.pausedUntil)}.`;
  if (!page) return 'Works on X, Reddit, YouTube, TikTok and Instagram.';
  if (!settings.sites[page.site]) return `Off on ${page.name}.`;
  if (!page.count) return `On for ${page.name}. Nothing to hide here yet.`;
  return `Hiding ${page.count} ${page.count === 1 ? 'thing' : 'things'} on this page.`;
}

function render() {
  $('enabled').checked = settings.enabled;
  document.body.classList.toggle('off', !settings.enabled);
  $('status').textContent = statusText();
  $('pause').hidden = !settings.enabled;
  $('pause').textContent = settings.pausedUntil > Date.now() ? 'Resume now' : 'Pause for 1 hour';
  for (const input of document.querySelectorAll('[name=mode]')) input.checked = settings[input.name] === input.value;
  $('modeHint').textContent = HINTS[settings.mode];
  for (const input of $('sites').querySelectorAll('input')) input.checked = settings.sites[input.value];
  for (const id of ['blockWords', 'allowWords']) {
    if (document.activeElement !== $(id)) $(id).value = settings[id].join('\n');
  }
}

async function loadPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  page = await chrome.tabs.sendMessage(tab.id, { type: 'status' }).catch(() => null);
}

async function save(patch) {
  settings = await S.saveSettings(patch);
  render();
  setTimeout(() => loadPage().then(render), 400);
}

$('sites').innerHTML = S.sites
  .map(site => `<label><input type="checkbox" value="${site.id}"><span>${site.name}</span></label>`)
  .join('');

$('enabled').addEventListener('change', e => save({ enabled: e.target.checked, pausedUntil: 0 }));
$('pause').addEventListener('click', () => save({ pausedUntil: settings.pausedUntil > Date.now() ? 0 : Date.now() + 60 * 60 * 1000 }));
$('sites').addEventListener('change', e => save({ sites: { ...settings.sites, [e.target.value]: e.target.checked } }));
for (const input of document.querySelectorAll('[name=mode]')) {
  input.addEventListener('change', () => save({ [input.name]: input.value }));
}
for (const id of ['blockWords', 'allowWords']) {
  let timer;
  $(id).addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => save({ [id]: words($(id).value) }), 500);
  });
}

(async () => {
  settings = await S.loadSettings();
  await loadPage();
  render();
})();
