const API_URL = "https://script.google.com/macros/s/AKfycbyspoYpEdIUwX2sLWAdB-ZcZlaf105Ga8b1eI_HSbe7HkKZz0pALOlQyvW9xttdJIUbYw/exec";

// Lignes exactes dans le classeur Sheets
const NOAH_TASKS = [
  { day: 'Lundi', task: 'Mettre la table', row: 3 },
  { day: 'Lundi', task: 'Vider le lave-vaisselle', row: 4 },
  { day: 'Mardi', task: 'Mettre la table', row: 5 },
  { day: 'Mardi', task: 'Vider le lave-vaisselle', row: 6 },
  { day: 'Mercredi', task: 'Mettre la table', row: 7 },
  { day: 'Mercredi', task: 'Vider le lave-vaisselle', row: 8 },
  { day: 'Jeudi', task: 'Mettre la table', row: 9 },
  { day: 'Jeudi', task: 'Vider le lave-vaisselle', row: 10 },
  { day: 'Vendredi', task: 'Mettre la table', row: 11 },
  { day: 'Vendredi', task: 'Vider le lave-vaisselle', row: 12 },
  { day: 'Samedi', task: 'Mettre la table', row: 13 },
  { day: 'Samedi', task: 'Vider le lave-vaisselle', row: 14 },
  { day: 'Dimanche', task: 'Mettre la table', row: 15 },
  { day: 'Dimanche', task: 'Vider le lave-vaisselle', row: 16 }
];

const NOELIA_TASKS = [
  { day: 'Lundi', task: 'Débarrasser la table', row: 19 },
  { day: 'Lundi', task: 'Remplir le lave-vaisselle', row: 20 },
  { day: 'Mardi', task: 'Débarrasser la table', row: 21 },
  { day: 'Mardi', task: 'Remplir le lave-vaisselle', row: 22 },
  { day: 'Mercredi', task: 'Débarrasser la table', row: 23 },
  { day: 'Mercredi', task: 'Remplir le lave-vaisselle', row: 24 },
  { day: 'Jeudi', task: 'Débarrasser la table', row: 25 },
  { day: 'Jeudi', task: 'Remplir le lave-vaisselle', row: 26 },
  { day: 'Vendredi', task: 'Débarrasser la table', row: 27 },
  { day: 'Vendredi', task: 'Remplir le lave-vaisselle', row: 28 },
  { day: 'Samedi', task: 'Débarrasser la table', row: 29 },
  { day: 'Samedi', task: 'Remplir le lave-vaisselle', row: 30 },
  { day: 'Dimanche', task: 'Débarrasser la table', row: 31 },
  { day: 'Dimanche', task: 'Remplir le lave-vaisselle', row: 32 }
];

let user = null;
let state = {
  noahDaily: Array(14).fill(0),
  noeliaDaily: Array(14).fill(0),
  noahBonus: 0,
  noeliaBonus: 0
};

// Chargement initial et restauration de session
document.addEventListener('DOMContentLoaded', () => {
  const savedState = localStorage.getItem('fratricide_state');
  if (savedState) {
    try { state = JSON.parse(savedState); } catch (e) {}
  }

  const savedUser = localStorage.getItem('fratricide_session');
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
      displayApp();
    } catch (e) {}
  }
});

function login() {
  const uEl = document.getElementById('username');
  const pEl = document.getElementById('password');
  if (!uEl || !pEl) return;

  const u = uEl.value.trim().toLowerCase();
  const p = pEl.value.trim();

  if (u === 'admin' && p === 'admin123') user = { role: 'admin', name: 'Admin (Parents)' };
  else if (u === 'noah' && p === 'noah123') user = { role: 'noah', name: 'Noah' };
  else if (u === 'noelia' && p === 'noelia123') user = { role: 'noelia', name: 'Noélia' };
  else {
    alert('Identifiants incorrects');
    return;
  }

  localStorage.setItem('fratricide_session', JSON.stringify(user));
  displayApp();
}

function displayApp() {
  const loginView = document.getElementById('login-screen');
  const appView = document.getElementById('app');
  const userDisplay = document.getElementById('user-tag');

  if (loginView) loginView.style.display = 'none';
  if (appView) appView.style.display = 'block';
  if (userDisplay && user) userDisplay.innerText = user.name;

  const selectEl = document.getElementById('bonus-assign');
  if (selectEl && user) {
    if (user.role === 'noah') selectEl.value = 'Noah';
    if (user.role === 'noelia') selectEl.value = 'Noélia';
  }

  setupTabs();
  render();
  loadDriveData();
}

function logout() {
  user = null;
  localStorage.removeItem('fratricide_session');
  const loginView = document.getElementById('login-screen');
  const appView = document.getElementById('app');
  if (loginView) loginView.style.display = 'block';
  if (appView) appView.style.display = 'none';
}

function setupTabs() {
  const nav = document.getElementById('nav-container');
  if (!nav || !user) return;
  nav.innerHTML = '';

  const tabs = [
    { id: 'dash', label: '📊 Tableau de bord', roles: ['admin', 'noah', 'noelia'] },
    { id: 'noah', label: '👦 Planning Noah', roles: ['admin', 'noah'] },
    { id: 'noelia', label: '👧 Planning Noélia', roles: ['admin', 'noelia'] },
    { id: 'bonus', label: '⭐ Tâches Bonus (1€)', roles: ['admin', 'noah', 'noelia'] }
  ];

  tabs.forEach((t, i) => {
    if (t.roles.includes(user.role)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `nav-tab ${i === 0 ? 'active' : ''}`;
      btn.innerText = t.label;
      btn.onclick = () => switchTab(t.id, btn);
      nav.appendChild(btn);
    }
  });

  if (nav.children.length > 0) {
    switchTab('dash', nav.children[0]);
  }
}

function switchTab(id, btn) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  ['dash', 'noah', 'noelia', 'bonus'].forEach(tabId => {
    const el = document.getElementById(`tab-${tabId}`);
    if (el) el.style.display = (tabId === id) ? 'block' : 'none';
  });
}

function persistState() {
  localStorage.setItem('fratricide_state', JSON.stringify(state));
}

async function loadDriveData() {
  const sync = document.getElementById('sync-indicator');
  if (sync) sync.innerText = 'Chargement Drive...';

  try {
    const res = await fetch(API_URL);
    const json = await res.json();

    if (json && json.status === 'success' && Array.isArray(json.data)) {
      // Tâches quotidiennes Noah
      NOAH_TASKS.forEach((item, idx) => {
        const val = json.data[item.row - 1] ? json.data[item.row - 1][2] : 0;
        state.noahDaily[idx] = (val == 1 || val === "1") ? 1 : 0;
      });

      // Tâches quotidiennes Noélia
      NOELIA_TASKS.forEach((item, idx) => {
        const val = json.data[item.row - 1] ? json.data[item.row - 1][2] : 0;
        state.noeliaDaily[idx] = (val == 1 || val === "1") ? 1 : 0;
      });

      // Lecture bonus : Lignes 36 à 39 (Noah), Lignes 40 à 43 (Noélia)
      let nBonus = 0;
      let noelBonus = 0;

      for (let r = 35; r <= 38; r++) {
        if (json.data[r]) nBonus += Number(json.data[r][2]) || 0;
      }
      for (let r = 39; r <= 42; r++) {
        if (json.data[r]) noelBonus += Number(json.data[r][2]) || 0;
      }

      state.noahBonus = nBonus;
      state.noeliaBonus = noelBonus;

      persistState();
      if (sync) sync.innerText = '🟢 Connecté Drive';
      render();
    }
  } catch (e) {
    if (sync) sync.innerText = '🟡 Mode Local';
    render();
  }
}

async function toggleTask(child, idx) {
  const taskList = child === 'noah' ? NOAH_TASKS : NOELIA_TASKS;
  const list = child === 'noah' ? state.noahDaily : state.noeliaDaily;

  list[idx] = list[idx] === 1 ? 0 : 1;
  persistState();
  render();

  const sync = document.getElementById('sync-indicator');
  if (sync) sync.innerText = 'Enregistrement...';

  try {
    const url = `${API_URL}?action=updateTask&row=${taskList[idx].row}&col=3&value=${list[idx]}`;
    await fetch(url, { mode: 'no-cors' });
    if (sync) sync.innerText = '🟢 Connecté Drive';
  } catch (e) {
    if (sync) sync.innerText = '🟡 Non synchronisé';
  }
}

async function submitBonus(taskName) {
  const select = document.getElementById('bonus-assign');
  let kid = select ? select.value : 'Noah';

  if (user && user.role === 'noah') kid = 'Noah';
  if (user && user.role === 'noelia') kid = 'Noélia';

  if (kid === 'Noah') state.noahBonus += 1;
  else state.noeliaBonus += 1;

  persistState();
  render();

  const sync = document.getElementById('sync-indicator');
  if (sync) sync.innerText = 'Enregistrement...';

  try {
    const url = `${API_URL}?action=addBonus&child=${encodeURIComponent(kid)}&task=${encodeURIComponent(taskName)}`;
    await fetch(url, { mode: 'no-cors' });
    if (sync) sync.innerText = '🟢 Connecté Drive';
  } catch (e) {
    if (sync) sync.innerText = '🟡 Non synchronisé';
  }
}

function render() {
  const noahDiv = document.getElementById('noah-tasks');
  if (noahDiv) {
    noahDiv.innerHTML = NOAH_TASKS.map((t, idx) => `
      <div class="task-row">
        <div><strong>${t.day}</strong> : ${t.task}</div>
        <button type="button" class="checkbox-btn ${state.noahDaily[idx] ? 'checked' : ''}" onclick="toggleTask('noah', ${idx})">
          ${state.noahDaily[idx] ? '✓' : ''}
        </button>
      </div>
    `).join('');
  }

  const noeliaDiv = document.getElementById('noelia-tasks');
  if (noeliaDiv) {
    noeliaDiv.innerHTML = NOELIA_TASKS.map((t, idx) => `
      <div class="task-row">
        <div><strong>${t.day}</strong> : ${t.task}</div>
        <button type="button" class="checkbox-btn ${state.noeliaDaily[idx] ? 'checked' : ''}" onclick="toggleTask('noelia', ${idx})">
          ${state.noeliaDaily[idx] ? '✓' : ''}
        </button>
      </div>
    `).join('');
  }

  // Calculs quotidiens et assiduité
  const noahPts = state.noahDaily.filter(v => v === 1).length * 0.5;
  const noeliaPts = state.noeliaDaily.filter(v => v === 1).length * 0.5;

  const maxPts = 14 * 0.5;
  const noahPct = maxPts > 0 ? (noahPts / maxPts) : 0;
  const noeliaPct = maxPts > 0 ? (noeliaPts / maxPts) : 0;

  const diff = Math.abs(noahPct - noeliaPct);
  let noahFinal = state.noahBonus;
  let noeliaFinal = state.noeliaBonus;
  let explanation = "";

  if (noahPct > noeliaPct) {
    const transfer = state.noeliaBonus * diff;
    noahFinal += transfer;
    noeliaFinal = Math.max(0, noeliaFinal - transfer);
    explanation = `Noah a réalisé ${(diff * 100).toFixed(1)}% de tâches en plus. Il prend ${transfer.toFixed(2)} € sur la cagnotte de Noélia.`;
  } else if (noeliaPct > noahPct) {
    const transfer = state.noahBonus * diff;
    noahFinal += transfer;
    noahFinal = Math.max(0, noahFinal - transfer);
    explanation = `Noélia a réalisé ${(diff * 100).toFixed(1)}% de tâches en plus. Elle prend ${transfer.toFixed(2)} € sur la cagnotte de Noah.`;
  } else {
    explanation = "Égalité : chacun conserve l'intégralité de ses récompenses.";
  }

  const elNoahPts = document.getElementById('d-noah-pts');
  const elNoahBonus = document.getElementById('d-noah-bonus');
  const elNoahFinal = document.getElementById('d-noah-final');
  const elNoeliaPts = document.getElementById('d-noelia-pts');
  const elNoeliaBonus = document.getElementById('d-noelia-bonus');
  const elNoeliaFinal = document.getElementById('d-noelia-final');
  const elDiffText = document.getElementById('diff-text');

  if (elNoahPts) elNoahPts.innerText = noahPts.toFixed(1);
  if (elNoahBonus) elNoahBonus.innerText = state.noahBonus.toFixed(2);
  if (elNoahFinal) elNoahFinal.innerText = noahFinal.toFixed(2) + ' €';

  if (elNoeliaPts) elNoeliaPts.innerText = noeliaPts.toFixed(1);
  if (elNoeliaBonus) elNoeliaBonus.innerText = state.noeliaBonus.toFixed(2);
  if (elNoeliaFinal) elNoeliaFinal.innerText = noeliaFinal.toFixed(2) + ' €';

  if (elDiffText) elDiffText.innerText = explanation;
}
