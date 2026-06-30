// ===== UTILITY =====
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  return t.substring(0, 5);
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

// ===== INSTALL PWA =====
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('#install-banner').classList.remove('hidden');
});

$('#btn-install')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('#install-banner').classList.add('hidden');
});

$('#btn-install-close')?.addEventListener('click', () => {
  $('#install-banner').classList.add('hidden');
});

// ===== LOGOUT =====
$('#btn-logout')?.addEventListener('click', async () => {
  await Auth.signOut();
  Router.navigate('/login');
});

// ===== NAV DINAMICA =====
function renderNav(role) {
  const nav = $('#bottom-nav');
  const common = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/calendar', icon: '📅', label: 'Calendario' },
    { path: '/matches', icon: '🏆', label: 'Partite' },
    { path: '/standings', icon: '🥇', label: 'Classifica' },
    { path: '/attendance', icon: '✅', label: 'Presenze' }
  ];
  const mister = [
    { path: '/roster', icon: '👥', label: 'Rosa' },
    { path: '/championship', icon: '🏆', label: 'Campionato' },
	{ path: '/trainings', icon: '🏃', label: 'Allenam.' },
    { path: '/stats', icon: '📊', label: 'Statistiche' },
    { path: '/whatsapp', icon: '📱', label: 'WhatsApp' }
  ];
  const items = role === 'mister' ? [...common, ...mister] : common;
  nav.innerHTML = items.map(i => `
    <button class="nav-item" data-path="${i.path}" onclick="Router.navigate('${i.path}')">
      <span class="nav-icon">${i.icon}</span>
      <span>${i.label}</span>
    </button>
  `).join('');
}

// ===== REGISTRA ROUTES =====
Router.register('/login', () => LoginPage.render());
Router.register('/register', () => RegisterPage.render());
Router.register('/reset', () => ResetPage.render());
Router.register('/', () => HomePage.render());
Router.register('/calendar', () => CalendarPage.render());
Router.register('/matches', () => MatchesPage.render());
Router.register('/trainings', () => TrainingsPage.render());

// Placeholder per le prossime pagine
Router.register('/standings', async () => {
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2>🥇 Classifica</h2>
      <p style="margin:12px 0; color: var(--gray-500);">Prossimamente...</p>
    </div>
  `;
});
Router.register('/attendance', async () => {
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2>✅ Presenze</h2>
      <p style="margin:12px 0; color: var(--gray-500);">Prossimamente...</p>
    </div>
  `;
});
Router.register('/roster', async () => {
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2>👥 Rosa</h2>
      <p style="margin:12px 0; color: var(--gray-500);">Prossimamente...</p>
    </div>
  `;
});
Router.register('/championship', async () => {
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2>🏆 Campionato</h2>
      <p style="margin:12px 0; color: var(--gray-500);">Prossimamente...</p>
    </div>
  `;
});
Router.register('/stats', async () => {
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2>📊 Statistiche</h2>
      <p style="margin:12px 0; color: var(--gray-500);">Prossimamente...</p>
    </div>
  `;
});
Router.register('/whatsapp', async () => {
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2>📱 WhatsApp</h2>
      <p style="margin:12px 0; color: var(--gray-500);">Prossimamente...</p>
    </div>
  `;
});

// Placeholder per le altre pagine (le creeremo nei prossimi step)
Router.register('/', async () => {
  const { profile } = await Auth.getCurrentUser();
  document.getElementById('view').innerHTML = `
    <div class="card text-center" style="margin-top:20px;">
      <h2 style="color:var(--granata);">👋 Benvenuto!</h2>
      <p style="margin:12px 0;">Ciao <strong>${profile.full_name}</strong></p>
      <p style="color:var(--gray-500);">Ruolo: <span class="badge badge-granata">${profile.role}</span></p>
      <p style="margin-top:20px; color:var(--gray-500);">
        Le pagine saranno disponibili nei prossimi step.
      </p>
    </div>
  `;
});

// ===== INIT =====
async function init() {
  const auth = await Auth.getCurrentUser();
  if (auth?.profile) {
    $('#app-header').classList.remove('hidden');
    $('#bottom-nav').classList.remove('hidden');
    $('#user-name').textContent = auth.profile.full_name || auth.user.email;
    renderNav(auth.profile.role);
  } else {
    $('#app-header').classList.add('hidden');
    $('#bottom-nav').classList.add('hidden');
  }
  Router.resolve();
}

db.auth.onAuthStateChange(() => init());
init();

window.toast = toast;
window.formatDate = formatDate;
window.formatTime = formatTime;