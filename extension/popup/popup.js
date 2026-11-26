const S = globalThis.spoil6;
const $ = id => document.getElementById(id);

const HINTS = {
  all: 'Covers anything that mentions GTA 6 or its characters and places.',
  spoilers: 'Covers GTA 6 posts about the story, missions, deaths or the ending.',
};

let settings;
let page = null;
let storyNote = '';

const words = text => [...new Set(text.split(/[\n,]/).map(w => w.trim()).filter(Boolean))];

function statusText() {
  if (!settings.enabled) return 'Off. Spoilers can show.';
  if (!page) return 'Works on X, Reddit, YouTube, TikTok and Instagram.';
  if (!settings.sites[page.site]) return `Off on ${page.name}.`;
  if (!page.count) return `On for ${page.name}. Nothing to hide here yet.`;
  return `Hiding ${page.count} ${page.count === 1 ? 'thing' : 'things'} on this page.`;
}

function progressText() {
  const known = S.story.missions;
  if (storyNote) return storyNote;
  if (!settings.progress) return 'Type the last story mission you finished, the way the game names it. Posts about missions after it get covered.';
  if (settings.progress >= known) return `Past mission ${settings.progress}. The list only knows the first ${known} story missions so far, so it can't tell what's later yet.`;
  return `Past mission ${settings.progress}. Posts about later missions get covered.`;
}

function render() {
  $('enabled').checked = settings.enabled;
  document.body.classList.toggle('off', !settings.enabled);
  $('status').textContent = statusText();
  for (const input of document.querySelectorAll('[name=mode]')) input.checked = settings[input.name] === input.value;
  $('modeHint').textContent = HINTS[settings.mode];
  $('story').hidden = !S.story?.missions;
  if (S.story?.missions) {
    $('progressHint').textContent = progressText();
    $('clearProgress').hidden = !settings.progress || Boolean(storyNote);
  }
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

$('enabled').addEventListener('change', e => save({ enabled: e.target.checked }));
$('progress').addEventListener('change', () => {
  const value = $('progress').value.trim();
  if (!value) return;
  const mission = /^\d+$/.test(value) ? Math.min(Number(value), 999) : S.story.names[S.storyKey(value)];
  if (mission > 0) {
    storyNote = '';
    $('progress').value = '';
    save({ progress: mission });
  } else {
    storyNote = `Couldn't find that story mission. Check the spelling. The list only knows the first ${S.story.missions} so far.`;
    render();
  }
});
$('progress').addEventListener('input', () => {
  if (!storyNote) return;
  storyNote = '';
  render();
});
$('clearProgress').addEventListener('click', () => save({ progress: 0 }));
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
