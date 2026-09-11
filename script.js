const API_URL = "https://script.google.com/macros/s/AKfycbyspoYpEdIUwX2sLWAdB-ZcZlaf105Ga8b1eI_HSbe7HkKZz0pALOlQyvW9xttdJIUbYw/exec";

// Gestion directe des noms de fichiers images
const AVATARS = {
  Noah: "noah.PNG",
  Noélia: "noélia.PNG"
};

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
  { day: 'Lundi', task: 'Débarrasser la table', row: 21 },
  { day: 'Lundi', task: 'Remplir le lave-vaisselle', row: 22 },
  { day: 'Mardi', task: 'Débarrasser la table', row: 23 },
  { day: 'Mardi', task: 'Remplir le lave-vaisselle', row: 24 },
  { day: 'Mercredi', task: 'Débarrasser la table', row: 25 },
  { day: 'Mercredi', task: 'Remplir le lave-vaisselle', row: 26 },
  { day: 'Jeudi', task: 'Débarrasser la table', row: 27 },
  { day: 'Jeudi', task: 'Remplir le lave-vaisselle', row: 28 },
  { day: 'Vendredi', task: 'Débarrasser la table', row: 29 },
  { day: 'Vendredi', task: 'Remplir le lave-vaisselle', row: 30 },
  { day: 'Samedi', task: 'Débarrasser la table', row: 31 },
  { day: 'Samedi', task: 'Remplir le lave-vaisselle', row: 32 },
  { day: 'Dimanche', task: 'Débarrasser la table', row: 33 },
  { day: 'Dimanche', task: 'Remplir le lave-vaisselle', row: 34 }
];

let user = null;
let state = {
  noahDaily: Array(14).fill(0),
  noeliaDaily: Array(14).fill(0),
  noahBonus: 0,
  noeliaBonus: 0
};

document.addEventListener('DOMContentLoaded', () => {
  const savedState = localStorage.getItem('fratricide_state');
  if (savedState) {
    try { state = JSON.parse(savedState); } catch(e) {}
  }

  const savedUser = localStorage.getItem('fratricide_session');
  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
      displayApp();
    } catch(e) {}
  }
});

function login() {
  const uEl = document.getElementById('username');
  const pEl = document.getElementById('password');
  if (!uEl || !pEl) return;

  const u = uEl.value.trim().toLowerCase();
  const p = pEl.value.trim();

  if (u === 'admin' && p === 'admin123') user = { role: 'admin', name: 'Papa & Maman' };
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

  const resetCard = document.getElementById('admin-reset-card');
  if (resetCard) {
    resetCard.style.display = (user && user.role === 'admin') ? 'block' : 'none';
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
  if (loginView) loginView.style.display = 'flex';
  if (appView) appView.style.display = 'none';
}

function setupTabs() {
  const nav = document.getElementById('nav-container');
  if (!nav || !user) return;
  nav.innerHTML = '';

  const tabs = [
    { id: 'dash', label: '📊 Duel', roles: ['admin', 'noah', 'noelia'] },
    { id: 'noah', label: '👦 Noah', roles: ['admin', 'noah'] },
    { id: 'noelia', label: '👧 Noélia', roles: ['admin', 'noelia'] },
    { id: 'bonus', label: '⭐ Bonus', roles: ['admin', 'noah', 'noelia'] }
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
  if (sync) sync.innerText = 'Synchronisation...';

  try {
    const res = await fetch(API_URL);
    const json = await res.json();

    if (json && json.status === 'success' && Array.isArray(json.data)) {
      NOAH_TASKS.forEach((item, idx) => {
        const rowData = json.data[item.row - 1];
        const val = rowData ? rowData[2] : 0;
        state.noahDaily[idx] = (val == 1 || val === "1") ? 1 : 0;
      });

      NOELIA_TASKS.forEach((item, idx) => {
        const rowData = json.data[item.row - 1];
        const val = rowData ? rowData[2] : 0;
        state.noeliaDaily[idx] = (val == 1 || val === "1") ? 1 : 0;
      });

      let nBonus = 0;
      let noelBonus = 0;

      for (let r = 0; r < json.data.length; r++) {
        const row = json.data[r];
        if (!row) continue;
        const name = String(row[0] || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const rawCount = parseFloat(row[2]);
        const count = isNaN(rawCount) ? 0 : rawCount;

        if (name === 'noah') nBonus += count;
        else if (name === 'noelia') noelBonus += count;
      }

      state.noahBonus = nBonus;
      state.noeliaBonus = noelBonus;

      persistState();
      if (sync) sync.innerText = '🟢 Drive OK';
      render();
    }
  } catch (e) {
    if (sync) sync.innerText = '🟡 Local';
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
    if (sync) sync.innerText = '🟢 Drive OK';
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
    if (sync) sync.innerText = '🟢 Drive OK';
  } catch (e) {
    if (sync) sync.innerText = '🟡 Non synchronisé';
  }
}

async function closeWeek() {
  const noahPts = state.noahDaily.filter(v => v === 1).length * 0.5;
  const noeliaPts = state.noeliaDaily.filter(v => v === 1).length * 0.5;
  const maxPts = 14 * 0.5;
  const noahPct = maxPts > 0 ? (noahPts / maxPts) : 0;
  const noeliaPct = maxPts > 0 ? (noeliaPts / maxPts) : 0;
  const diff = Math.abs(noahPct - noeliaPct);

  let noahLocked = state.noahBonus;
  let noeliaLocked = state.noeliaBonus;

  if (noahPct > noeliaPct) {
    const transfer = state.noeliaBonus * diff;
    noahLocked += transfer;
    noeliaLocked = Math.max(0, state.noeliaBonus - transfer);
  } else if (noeliaPct > noahPct) {
    const transfer = state.noahBonus * diff;
    noeliaLocked += transfer;
    noahLocked = Math.max(0, state.noahBonus - transfer);
  }

  noahLocked = Number(noahLocked.toFixed(2));
  noeliaLocked = Number(noeliaLocked.toFixed(2));

  if (!confirm(`⚠️ Clôturer la semaine ?\n\nNouveaux soldes verrouillés :\n• Noah : ${noahLocked.toFixed(2)} €\n• Noélia : ${noeliaLocked.toFixed(2)} €\n\nLe planning quotidien sera remis à zéro pour la nouvelle semaine.`)) return;

  state.noahBonus = noahLocked;
  state.noeliaBonus = noeliaLocked;
  state.noahDaily = Array(14).fill(0);
  state.noeliaDaily = Array(14).fill(0);

  persistState();
  render();

  const sync = document.getElementById('sync-indicator');
  if (sync) sync.innerText = 'Clôture semaine...';

  try {
    const url = `${API_URL}?action=closeWeek&noahFinal=${noahLocked}&noeliaFinal=${noeliaLocked}`;
    await fetch(url, { mode: 'no-cors' });
    if (sync) sync.innerText = '🟢 Drive OK';
    alert("Semaine clôturée avec succès ! Les montants sont verrouillés.");
  } catch (e) {
    if (sync) sync.innerText = '🟡 Non synchronisé';
  }
}

async function payKids() {
  if (!confirm("💶 Confirmer le paiement des enfants ?\n\nCela remettra les porte-monnaies de Noah et Noélia à 0,00 €.")) return;

  state.noahBonus = 0;
  state.noeliaBonus = 0;
  persistState();
  render();

  const sync = document.getElementById('sync-indicator');
  if (sync) sync.innerText = 'Paiement effectué...';

  try {
    const url = `${API_URL}?action=payOut`;
    await fetch(url, { mode: 'no-cors' });
    if (sync) sync.innerText = '🟢 Drive OK';
    alert("Porte-monnaies remis à 0,00 € !");
  } catch (e) {
    if (sync) sync.innerText = '🟡 Non synchronisé';
  }
}

function render() {
  const noahDiv = document.getElementById('noah-tasks');
  if (noahDiv) {
    noahDiv.innerHTML = NOAH_TASKS.map((t, idx) => `
      <div class="task-row">
        <div class="task-info">
          <strong>${t.day}</strong>
          <span>${t.task}</span>
        </div>
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
        <div class="task-info">
          <strong>${t.day}</strong>
          <span>${t.task}</span>
        </div>
        <button type="button" class="checkbox-btn ${state.noeliaDaily[idx] ? 'checked' : ''}" onclick="toggleTask('noelia', ${idx})">
          ${state.noeliaDaily[idx] ? '✓' : ''}
        </button>
      </div>
    `).join('');
  }

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
    noeliaFinal = Math.max(0, state.noeliaBonus - transfer);
    explanation = `Noah a ${(diff * 100).toFixed(1)}% d'assiduité en plus. Il prend ${transfer.toFixed(2)} € sur la cagnotte de Noélia.`;
  } else if (noeliaPct > noahPct) {
    const transfer = state.noahBonus * diff;
    noeliaFinal += transfer;
    noahFinal = Math.max(0, state.noahBonus - transfer);
    explanation = `Noélia a ${(diff * 100).toFixed(1)}% d'assiduité en plus. Elle prend ${transfer.toFixed(2)} € sur la cagnotte de Noah.`;
  } else {
    explanation = "Égalité parfaite : aucun transfert de cagnotte.";
  }

  const leaderPhoto = document.getElementById('leader-photo');
  const leaderName = document.getElementById('leader-name');
  const leaderDesc = document.getElementById('leader-desc');

  if (noahPts > noeliaPts) {
    if (leaderName) leaderName.innerText = "Noah mène la danse !";
    if (leaderDesc) leaderDesc.innerText = `Avance de +${(noahPts - noeliaPts).toFixed(1)} points quotidiens`;
    if (leaderPhoto) leaderPhoto.src = AVATARS.Noah;
  } else if (noeliaPts > noahPts) {
    if (leaderName) leaderName.innerText = "Noélia mène la danse !";
    if (leaderDesc) leaderDesc.innerText = `Avance de +${(noeliaPts - noahPts).toFixed(1)} points quotidiens`;
    if (leaderPhoto) leaderPhoto.src = AVATARS.Noélia;
  } else {
    if (leaderName) leaderName.innerText = "Égalité sur le podium !";
    if (leaderDesc) leaderDesc.innerText = `${noahPts.toFixed(1)} points chacun`;
    if (leaderPhoto) leaderPhoto.src = "https://api.dicebear.com/7.x/bottts/svg?seed=duel";
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
