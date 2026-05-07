const DEFAULTS = {
  theme: 'auto',
  maxWidth: 'full',
  fontSize: 'medium',
  showTOC: false,
  enableMermaid: false,
  enableKatex: false
};
const IDS = ['theme', 'maxWidth', 'fontSize', 'showTOC', 'enableMermaid', 'enableKatex'];

async function load() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  for (const id of IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = !!s[id];
    else el.value = s[id];
  }
}

let savedTimer = 0;
function flashSaved() {
  const el = document.getElementById('saved');
  el.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { el.hidden = true; }, 1200);
}

function wire() {
  for (const id of IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('change', async () => {
      const val = el.type === 'checkbox' ? el.checked : el.value;
      await chrome.storage.sync.set({ [id]: val });
      flashSaved();
    });
  }
}

load().then(wire);
