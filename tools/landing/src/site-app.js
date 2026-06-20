import { DEFAULT_SITE_DATA } from './site-data.js';

const STORAGE_KEY = 'spartans-site-boilerplate-v0.1';
const sections = ['home', 'players', 'games', 'opponents', 'strategies', 'data'];
let data = loadData();
let route = location.hash.replace('#', '') || 'home';
if (!sections.includes(route)) route = 'home';

const app = document.getElementById('app');
const nav = document.getElementById('nav');
const statusEl = document.getElementById('status');

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function slug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `item-${Date.now()}`;
}
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : clone(DEFAULT_SITE_DATA);
  } catch (err) {
    console.warn('Could not load saved data', err);
    return clone(DEFAULT_SITE_DATA);
  }
}
function saveData(message = 'Saved locally') {
  data.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  setStatus(message);
}
function setStatus(message) {
  if (statusEl) statusEl.textContent = `${message} · ${new Date().toLocaleString()}`;
}
function count(section) { return Object.keys(data[section] || {}).length; }
function objectList(section) { return Object.values(data[section] || {}); }
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function go(nextRoute) {
  route = nextRoute;
  history.replaceState(null, '', `#${route}`);
  render();
}

window.addEventListener('hashchange', () => {
  const next = location.hash.replace('#', '') || 'home';
  route = sections.includes(next) ? next : 'home';
  render();
});

function renderNav() {
  nav.innerHTML = [
    ['home', 'Home'],
    ['players', 'Players'],
    ['games', 'Games'],
    ['opponents', 'Opponents'],
    ['strategies', 'Strategies'],
    ['data', 'Backup / Data']
  ].map(([id, label]) => `<button class="${route === id ? 'active' : ''}" data-go="${id}">${label}</button>`).join('');
  nav.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => go(btn.dataset.go)));
}

function render() {
  renderNav();
  if (route === 'home') renderHome();
  if (route === 'players') renderPlayers();
  if (route === 'games') renderGames();
  if (route === 'opponents') renderOpponents();
  if (route === 'strategies') renderStrategies();
  if (route === 'data') renderData();
}

function renderHome() {
  app.innerHTML = `
    <section class="hero">
      <div class="card">
        <div class="kicker">${esc(data.meta.season)} · ${esc(data.meta.teamName)}</div>
        <h1>Spartans tracker hub</h1>
        <p class="sub">A boilerplate landing page for the team website. Click into Players, Games, Opponents, or Strategies. Edits save in this browser and the Backup / Data page exports the full dataset.</p>
        <div class="actions">
          <button class="primary" data-go="players">Open players</button>
          <button data-go="games">Open games</button>
          <button class="success" id="quickExport">Download all data</button>
        </div>
      </div>
      <div class="card">
        <div class="kicker">Counts</div>
        <div class="stats-strip">
          <div class="stat"><div class="num">${count('players')}</div><div class="label">Players</div></div>
          <div class="stat"><div class="num">${count('games')}</div><div class="label">Games</div></div>
          <div class="stat"><div class="num">${count('opponents')}</div><div class="label">Opponents</div></div>
          <div class="stat"><div class="num">${count('strategies')}</div><div class="label">Strategies</div></div>
        </div>
        <p class="footer-note">Latest local edit: ${esc(new Date(data.meta.updatedAt || Date.now()).toLocaleString())}</p>
      </div>
    </section>
    <section class="landing-grid">
      ${landingCard('players', '🧍', 'Players', 'Names, jersey numbers, positions, roles, notes.')}
      ${landingCard('games', '🏀', 'Games', 'Opponent, score, film link, locked report link, notes.')}
      ${landingCard('opponents', '🛡️', 'Opponents', 'Team name, scouting notes, key players, strategy notes.')}
      ${landingCard('strategies', '📋', 'Strategies', 'Offense, defense, team rules, film notes.')}
    </section>
  `;
  bindGlobalActions();
}
function landingCard(id, icon, title, desc) {
  return `<button class="big-link" data-go="${id}"><span class="icon">${icon}</span><span><h2>${title}</h2><p>${desc}</p></span><b>Open →</b></button>`;
}

function sectionToolbar(title, subtitle, section) {
  const singular = { players: 'Player', games: 'Game', opponents: 'Opponent', strategies: 'Strategy' }[section] || 'Item';
  return `
    <div class="section-head">
      <div>
        <div class="kicker">Track · ${esc(data.meta.teamName)}</div>
        <h1>${title}</h1>
        <p class="sub">${subtitle}</p>
      </div>
      <div class="actions">
        <button class="primary" data-add="${section}">Add ${singular}</button>
        <button class="success" id="quickExport">Download all data</button>
        <button data-go="data">Backup / Data</button>
      </div>
    </div>`;
}

function renderPlayers() {
  app.innerHTML = `
    ${sectionToolbar('Players', 'Boilerplate roster/profile cards. Later this can connect to stat reports per player.', 'players')}
    <div class="grid">
      ${objectList('players').map(p => `
        <div class="card item-card">
          <div class="kicker">#${esc(p.jersey || '—')} · ${esc(p.position || 'Position TBC')}</div>
          <h2>${esc(p.name)}</h2>
          <div class="meta"><span class="badge">${esc(p.role || 'Role TBC')}</span>${p.height ? `<span class="badge">${esc(p.height)}</span>` : ''}</div>
          <p class="item-note">${esc(p.notes || '')}</p>
          <div class="actions"><button data-edit="players" data-id="${esc(p.id)}">Edit</button><button data-delete="players" data-id="${esc(p.id)}">Delete</button></div>
        </div>`).join('')}
    </div>
    <div id="editPanel" class="card edit-panel"></div>`;
  bindCrud('players');
}

function renderGames() {
  app.innerHTML = `
    ${sectionToolbar('Games', 'Matches, opponents, scores, YouTube links, report links, and game notes.', 'games')}
    <div class="grid">
      ${objectList('games').map(g => `
        <div class="card item-card">
          <div class="kicker">${esc(g.id)}</div>
          <h2>${esc(g.name)}</h2>
          <div class="meta">
            <span class="badge ${g.result === 'W' ? 'win' : g.result === 'L' ? 'loss' : ''}">${esc(g.result || 'Result TBC')}</span>
            <span class="badge">${esc(g.scoreFor ?? '')}-${esc(g.scoreAgainst ?? '')}</span>
            <span class="badge">vs ${esc(g.opponentName || g.opponentId || 'Opponent TBC')}</span>
          </div>
          <p class="item-note">${esc(g.notes || '')}</p>
          <div class="actions">
            ${g.youtubeUrl ? `<a href="${esc(g.youtubeUrl)}" target="_blank"><button>Film</button></a>` : ''}
            ${g.reportUrl ? `<a href="${esc(g.reportUrl)}" target="_blank"><button>Report</button></a>` : ''}
            <button data-edit="games" data-id="${esc(g.id)}">Edit</button><button data-delete="games" data-id="${esc(g.id)}">Delete</button>
          </div>
        </div>`).join('')}
    </div>
    <div id="editPanel" class="card edit-panel"></div>`;
  bindCrud('games');
}

function renderOpponents() {
  app.innerHTML = `
    ${sectionToolbar('Opponents', 'Simple opponent database for scouting notes for now.', 'opponents')}
    <div class="grid">
      ${objectList('opponents').map(o => `
        <div class="card item-card">
          <div class="kicker">Opponent</div>
          <h2>${esc(o.name)}</h2>
          <div class="meta">${o.record ? `<span class="badge">${esc(o.record)}</span>` : '<span class="badge">Record TBC</span>'}</div>
          <p class="item-note"><b>Notes:</b> ${esc(o.notes || '')}\n\n<b>Key players:</b> ${esc(o.keyPlayers || '')}\n\n<b>Strategy:</b> ${esc(o.strategyNotes || '')}</p>
          <div class="actions"><button data-edit="opponents" data-id="${esc(o.id)}">Edit</button><button data-delete="opponents" data-id="${esc(o.id)}">Delete</button></div>
        </div>`).join('')}
    </div>
    <div id="editPanel" class="card edit-panel"></div>`;
  bindCrud('opponents');
}

function renderStrategies() {
  app.innerHTML = `
    ${sectionToolbar('Strategies', 'Editable notes for offensive concepts, defensive rules, and opponent plans.', 'strategies')}
    <div class="grid">
      ${objectList('strategies').map(s => `
        <div class="card item-card">
          <div class="kicker">${esc(s.category || 'Strategy')}</div>
          <h2>${esc(s.title)}</h2>
          <p class="item-note"><b>${esc(s.summary || '')}</b>\n\n${esc(s.notes || '')}</p>
          <div class="actions"><button data-edit="strategies" data-id="${esc(s.id)}">Edit</button><button data-delete="strategies" data-id="${esc(s.id)}">Delete</button></div>
        </div>`).join('')}
    </div>
    <div id="editPanel" class="card edit-panel"></div>`;
  bindCrud('strategies');
}

function bindCrud(section) {
  bindGlobalActions();
  document.querySelectorAll(`[data-add="${section}"]`).forEach(btn => btn.addEventListener('click', () => openEditor(section)));
  document.querySelectorAll(`[data-edit="${section}"]`).forEach(btn => btn.addEventListener('click', () => openEditor(section, btn.dataset.id)));
  document.querySelectorAll(`[data-delete="${section}"]`).forEach(btn => btn.addEventListener('click', () => {
    if (!confirm('Delete this item? Export a backup first if you are not sure.')) return;
    delete data[section][btn.dataset.id];
    saveData('Deleted item');
    render();
  }));
}

const fieldSets = {
  players: [
    ['name', 'Name'], ['jersey', 'Jersey'], ['position', 'Position'], ['height', 'Height'], ['role', 'Role'], ['photo', 'Photo URL'], ['notes', 'Notes', 'textarea']
  ],
  games: [
    ['name', 'Game name'], ['opponentName', 'Opponent name'], ['opponentId', 'Opponent ID'], ['date', 'Date'], ['scoreFor', 'Spartans score'], ['scoreAgainst', 'Opponent score'], ['result', 'Result'], ['youtubeUrl', 'YouTube URL'], ['llc', 'LLC path'], ['reportUrl', 'Report URL'], ['notes', 'Notes', 'textarea']
  ],
  opponents: [
    ['name', 'Team name'], ['record', 'Record'], ['notes', 'Notes', 'textarea'], ['keyPlayers', 'Key players', 'textarea'], ['strategyNotes', 'Strategy notes', 'textarea']
  ],
  strategies: [
    ['title', 'Title'], ['category', 'Category'], ['summary', 'Summary', 'textarea'], ['notes', 'Notes', 'textarea']
  ]
};

function openEditor(section, id = null) {
  const panel = document.getElementById('editPanel');
  const existing = id ? data[section][id] : null;
  const draft = existing ? clone(existing) : { id: '', ...(section === 'games' ? { result: '', scoreFor: '', scoreAgainst: '' } : {}) };
  const title = id ? `Edit ${id}` : `Add ${section.slice(0, -1)}`;
  panel.classList.add('open');
  panel.innerHTML = `
    <h2>${esc(title)}</h2>
    <div class="form-grid">
      <div class="field"><label>ID</label><input id="edit_id" value="${esc(draft.id || '')}" placeholder="auto-from-name if blank" ${id ? 'disabled' : ''}></div>
      ${fieldSets[section].map(([key, label, type]) => `
        <div class="field ${type === 'textarea' ? 'full' : ''}">
          <label>${esc(label)}</label>
          ${type === 'textarea' ? `<textarea id="edit_${key}">${esc(draft[key] || '')}</textarea>` : `<input id="edit_${key}" value="${esc(draft[key] ?? '')}">`}
        </div>`).join('')}
    </div>
    <div class="actions"><button class="primary" id="saveItem">Save</button><button id="cancelEdit">Cancel</button></div>
  `;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('cancelEdit').addEventListener('click', () => panel.classList.remove('open'));
  document.getElementById('saveItem').addEventListener('click', () => {
    const item = {};
    const rawId = id || document.getElementById('edit_id').value || document.getElementById('edit_name')?.value || document.getElementById('edit_title')?.value;
    item.id = id || slug(rawId);
    fieldSets[section].forEach(([key]) => {
      const input = document.getElementById(`edit_${key}`);
      item[key] = input ? input.value : '';
    });
    if (section === 'games') {
      item.scoreFor = Number(item.scoreFor || 0);
      item.scoreAgainst = Number(item.scoreAgainst || 0);
    }
    data[section][item.id] = item;
    saveData('Saved item');
    render();
  });
}

function renderData() {
  app.innerHTML = `
    <div class="section-head">
      <div>
        <div class="kicker">Backup / data</div>
        <h1>All site data</h1>
        <p class="sub">This backs up and imports everything: players, games, opponents, and strategies. This is separate from the basketball stat tracker JSON.</p>
      </div>
      <div class="actions">
        <button class="success" id="downloadJson">Download all JSON</button>
        <button class="primary" id="applyJson">Apply JSON from box</button>
        <button id="loadFileBtn">Import JSON file</button>
        <button id="resetSample">Reset sample</button>
      </div>
    </div>
    <div class="card">
      <textarea class="data-box" id="dataBox">${esc(JSON.stringify(data, null, 2))}</textarea>
      <input id="fileInput" type="file" accept="application/json,.json" style="display:none">
      <p class="status">Edits save to browser localStorage. To update GitHub permanently, export JSON and commit the JSON files later.</p>
    </div>
    <div class="footer-note">Suggested repo files: <code>public/data/site-data.json</code>, <code>public/data/players.json</code>, <code>public/data/games.json</code>, <code>public/data/opponents.json</code>, <code>public/data/strategies.json</code>.</div>
  `;
  bindGlobalActions();
  document.getElementById('downloadJson').addEventListener('click', downloadAllJson);
  document.getElementById('applyJson').addEventListener('click', () => {
    try {
      const parsed = JSON.parse(document.getElementById('dataBox').value);
      data = normalizeData(parsed);
      saveData('Imported JSON from text box');
      render();
    } catch (err) {
      alert(`Could not parse JSON: ${err.message}`);
    }
  });
  document.getElementById('loadFileBtn').addEventListener('click', () => document.getElementById('fileInput').click());
  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      data = normalizeData(parsed);
      saveData(`Imported ${file.name}`);
      render();
    } catch (err) {
      alert(`Could not import file: ${err.message}`);
    }
  });
  document.getElementById('resetSample').addEventListener('click', () => {
    if (!confirm('Reset to boilerplate sample data?')) return;
    data = clone(DEFAULT_SITE_DATA);
    saveData('Reset to sample data');
    render();
  });
}

function normalizeData(input) {
  return {
    meta: { ...clone(DEFAULT_SITE_DATA).meta, ...(input.meta || {}) },
    players: input.players || {},
    games: input.games || {},
    opponents: input.opponents || {},
    strategies: input.strategies || {}
  };
}

function bindGlobalActions() {
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => go(btn.dataset.go)));
  document.querySelectorAll('#quickExport').forEach(btn => btn.addEventListener('click', downloadAllJson));
}

function downloadAllJson() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `spartans-site-data-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  setStatus('Downloaded all data JSON');
}

render();
setStatus('Ready');
