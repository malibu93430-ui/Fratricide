const API_URL = "https://script.google.com/macros/s/AKfycbyspoYpEdIUwX2sLWAdB-ZcZlaf105Ga8b1eI_HSbe7HkKZz0pALOlQyvW9xttdJIUbYw/exec";

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

// Initialisation sécurisée une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
  const savedState = localStorage.getItem('fratricide_state') || sessionStorage.getItem('fratricide_state');
  if (savedState) {
    try { state = JSON.parse(savedState); } catch (e) { console.error(e); }
  }

  const savedUser = localStorage.getItem('fratricide_session') || sessionStorage.getItem('fratricide_session');
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
      launchApp();
    } catch (e) { console.error(e); }
  }
});

function login() {
  const uInput = document.getElementById('username');
  const pInput = document.getElementById('password');
  if (!uInput || !pInput) return;

  const u = uInput.value.trim().toLowerCase();
  const p = pInput.value.trim();

  if (u === 'admin' && p === 'admin123') user = { role: 'admin', name: 'Admin (Parents)' };
  else if (u === 'noah' && p === 'noah123') user = { role: 'noah', name: 'Noah' };
  else if (u === 'noelia' && p === 'noelia123') user = { role: 'noelia', name: 'Noélia' };
  else {
    alert('Identifiants invalides');
    return;
  }

  const serialized = JSON.stringify(user);
  localStorage.setItem('fratricide_session', serialized);
  sessionStorage.setItem('fratricide_session', serialized);

  launchApp();
}

function launchApp() {
  const loginEl = document.getElementById('login-screen');
  const appEl = document.getElementById('app');
  const userTag = document.getElementById('user-tag');

  if (loginEl) loginEl.style.display = 'none';
  if (appEl) appEl.style.display = 'block';
  if (userTag && user) userTag.innerText = user.name;

  const bonusSelect = document.getElementById('bonus-assign');
  if (bonusSelect && user) {
    if (user.role === 'noah') bonusSelect.value = 'Noah';
    if (user.role === 'noelia') bonusSelect.value = 'Noélia';
  }

  setupTabs();
  render();
  loadDriveData();
}

function logout() {
  user = null;
  localStorage.removeItem('fratricide_session');
  sessionStorage.removeItem('fratricide_session');
  const loginEl = document.getElementById('login-screen');
  const appEl = document.getElementById('app');
  if (loginEl) loginEl.style.display = 'block';
  if (appEl) appEl.style.display = 'none';
}

function setupTabs() {
  const nav = document.getElementById('nav-container');
  if (!nav || !user) return;
  nav.innerHTML = '';

  const tabs = [
    { id: 'dash', label: '📊 Tableau de bord', access: ['admin', 'noah', 'noelia'] },
    { id: 'noah', label: '👦 Planning Noah', access: ['admin', 'noah'] },
    { id: 'noelia', label: '👧 Planning Noélia', access: ['admin', 'noelia'] },
    { id: 'bonus', label: '⭐ Tâches Bonus (1€)', access: ['admin', 'noah', 'noelia'] }
  ];

  tabs.forEach((t, i) => {
    if (t.access.includes(user.role)) {
      const b = document.createElement('button');
      b.className = `nav-tab ${i === 0 ? 'active' : ''}`;
      b.innerText = t.label;
      b.onclick = () => showTab(t.id, b);
      nav.appendChild(b);
    }
  });

  if (nav.children.length > 0) {
    showTab('dash', nav.children[0]);
  }
}

function showTab(id, btn) {
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  ['dash', 'noah', 'noelia', 'bonus'].forEach(tabId => {
    const el = document.getElementById(`tab-${tabId}`);
    if (el) el.style.display = (tabId === id) ? 'block' : 'none';
  });
}

function saveLocalState() {
  const str = JSON.stringify(state);
  localStorage.setItem('fratricide_state', str);
  sessionStorage.setItem('fratricide_state', str);
}

async function loadDriveData() {
  const badge = document.getElementById('sync-indicator');
  if (badge) badge.innerText = 'Chargement Drive...';

  try {
    const res = await fetch(API_URL);
    const json = await res.json();

    if (json && json.status === 'success' && Array.isArray(json.data)) {
      NOAH_TASKS.forEach((item, idx) => {
        const rowData = json.data[item.row - 1];
        const val = rowData ? rowData[2] : 0;
        state.noahDaily[idx] = (val == 1 || val == "1") ? 1 : 0;
      });

      NOELIA_TASKS.forEach((item, idx) => {
        const rowData = json.data[item.row - 1];
        const val = rowData ? rowData[2] : 0;
        state.noeliaDaily[idx] = (val == 1 || val == "1") ? 1 : 0;
      });

      let nBonus = 0;
      let noelBonus = 0;

      for (let r = 35; r < Math.min(json.data.length, 45); r++) {
        if (!json.data[r]) continue;
        const rowKid = String(json.data[r][0] || "").trim().toLowerCase();
        const count = Number(json.data[r][2]) || 0;

        if (rowKid === 'noah') {
          nBonus += count;
        } else if (rowKid.includes('noel')) {
          noelBonus += count;
        }
      }

      state.noahBonus = nBonus;
      state.noeliaBonus = noelBonus;

      saveLocalState();
      if (badge) badge.innerText = '🟢 Connecté Drive';
      render();
    }
  } catch (e) {
    console.warn("Synchronisation Drive indisponible, bascule en local :", e);
    if (badge) badge.innerText = '🟡 Mode Local';
    render();
  }
}

async function toggleTask(child, idx) {
  const taskList = child === 'noah' ? NOAH_TASKS : NOELIA_TASKS;
  const list = child === 'noah' ? state.noahDaily : state.noeliaDaily;

  list[idx] = list[idx] === 1 ? 0 : 1;
  saveLocalState();
  render();

  const badge = document.getElementById('sync-indicator');
  if (badge) badge.innerText = 'Enregistrement...';

  try {
    const url = `${API_URL}?action=updateTask&row=${taskList[idx].row}&col=3&value=${list[idx]}`;
    await fetch(url, { mode: 'no-cors' });
    if (badge) badge.innerText = '🟢 Connecté Drive';
  } catch (err) {
    if (badge) badge.innerText = '🟡 Non synchronisé';
  }
}

async function submitBonus(taskName) {
  const selectEl = document.getElementById('bonus-assign');
  let kid = selectEl ? selectEl.value : 'Noah';

  if (user && user.role === 'noah') kid = 'Noah';
  if (user && user.role === 'noelia') kid = 'Noélia';

  if (kid === 'Noah') state.noahBonus += 1;
  else state.noeliaBonus += 1;

  saveLocalState();
  render();

  const badge = document.getElementById('sync-indicator');
  if (badge) badge.innerText = 'Enregistrement...';

  try {
    const url = `${API_URL}?action=addBonus&child=${encodeURIComponent(kid)}&task=${encodeURIComponent(taskName)}`;
    await fetch(url, { mode: 'no-cors' });
    if (badge) badge.innerText = '🟢 Connecté Drive';
  } catch (err) {
    if (badge) badge.innerText = '🟡 Non synchronisé';
  }
}

function render() {
  const noahDiv = document.getElementById('noah-tasks');
  if (noahDiv) {
    noahDiv.innerHTML = NOAH_TASKS.map((t, idx) => `
      <div class="task-row">
        <div><strong>${t.day}</strong> : ${t.task}</div>
        <button class="checkbox-btn ${state.noahDaily[idx] ? 'checked' : ''}" onclick="toggleTask('noah', ${idx})">
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
        <button class="checkbox-btn ${state.noeliaDaily[idx] ? 'checked' : ''}" onclick="toggleTask('noelia', ${idx})">
          ${state.noeliaDaily[idx] ? '✓' : ''}
        </button>
      </div>
    `).join('');
  }

  const noahPts = state.noahDaily.filter(v => v === 1).length * 0.5;
  const noeliaPts = state.noeliaDaily.filter(v => v === 1).length * 0.5;

  const maxPossiblePts = 14 * 0.5;
  const noahPct = maxPossiblePts > 0 ? (noahPts / maxPossiblePts) : 0;
  const noeliaPct = maxPossiblePts > 0 ? (noeliaPts / maxPossiblePts) : 0;

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
