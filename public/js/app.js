// =====================================================================
// ASD San Carlo Milano - Under 9
// File principale dell'applicazione
// =====================================================================

// ===== UTILITY GLOBALI =====
function toast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;
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
  const banner = $('#install-banner');
  if (banner) banner.classList.remove('hidden');
});

$('#btn-install')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('#install-banner')?.classList.add('hidden');
});

$('#btn-install-close')?.addEventListener('click', () => {
  $('#install-banner')?.classList.add('hidden');
});

// ===== LOGOUT =====
$('#btn-logout')?.addEventListener('click', async () => {
  await Auth.signOut();
  Router.navigate('/login');
});

// ===== NAV DINAMICA =====
function renderNav(role) {
  const nav = $('#bottom-nav');
  if (!nav) return;

  const common = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/calendar', icon: '📅', label: 'Calendario' },
    { path: '/matches', icon: '🏆', label: 'Partite' },
    { path: '/standings', icon: '🥇', label: 'Classifica' },
    { path: '/attendance', icon: '✅', label: 'Presenze' }
  ];

  const mister = [
    { path: '/roster', icon: '👥', label: 'Rosa' },
    { path: '/championship', icon: '🏟️', label: 'Campionato' },
    { path: '/trainings', icon: '🏃', label: 'Allenam.' },
    { path: '/stats', icon: '📊', label: 'Stats' },
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

// =====================================================================
// REGISTRAZIONE ROUTES
// =====================================================================

// ----- Pagine pubbliche -----
Router.register('/login', () => LoginPage.render());
Router.register('/register', () => RegisterPage.render());
Router.register('/reset', () => ResetPage.render());

// ----- Home -----
Router.register('/', () => HomePage.render());

// ----- Pagine comuni (genitori + mister) -----
Router.register('/calendar', () => CalendarPage.render());
Router.register('/matches', () => MatchesPage.render());
Router.register('/standings', () => StandingsPage.render());
Router.register('/attendance', () => AttendancePage.render());

// ----- Pagine solo mister -----
Router.register('/roster', () => RosterPage.render());
Router.register('/championship', () => ChampionshipPage.render());
Router.register('/trainings', () => TrainingsPage.render());
Router.register('/stats', () => StatsPage.render());
Router.register('/whatsapp', () => WhatsAppPage.render());

// =====================================================================
// PLACEHOLDER per le pagine non ancora implementate
// (verranno sostituite nei prossimi step)
// =====================================================================

// ----- Classifica (punto 4) -----
window.StandingsPage = {
  async render() {
    document.getElementById('view').innerHTML = `
      <div class="card text-center" style="margin-top:20px;">
        <h2 style="color: var(--granata);">🥇 Classifica</h2>
        <p style="margin:12px 0; color: var(--gray-500);">
          Prossimamente...<br>
          <small>Calcolo basato sui tempi vinti</small>
        </p>
      </div>
    `;
  }
};

// ----- Rosa (punto 5) -----
window.RosterPage = {
  async render() {
    document.getElementById('view').innerHTML = `
      <div class="card text-center" style="margin-top:20px;">
        <h2 style="color: var(--granata);">👥 Rosa</h2>
        <p style="margin:12px 0; color: var(--gray-500);">
          Prossimamente...<br>
          <small>Gestione giocatori con ruoli</small>
        </p>
      </div>
    `;
  }
};

// ----- Campionato (punto 6) -----
window.ChampionshipPage = {
  async render() {
    document.getElementById('view').innerHTML = `
      <div class="card text-center" style="margin-top:20px;">
        <h2 style="color: var(--granata);">🏟️ Campionato</h2>
        <p style="margin:12px 0; color: var(--gray-500);">
          Prossimamente...<br>
          <small>Gestione squadre e partite</small>
        </p>
      </div>
    `;
  }
};

// ----- Statistiche (punto 7) -----
window.StatsPage = {
  async render() {
    document.getElementById('view').innerHTML = `
      <div class="card text-center" style="margin-top:20px;">
        <h2 style="color: var(--granata);">📊 Statistiche</h2>
        <p style="margin:12px 0; color: var(--gray-500);">
          Prossimamente...<br>
          <small>Presenze con export PDF</small>
        </p>
      </div>
    `;
  }
};

// ----- WhatsApp (punto 8) -----
window.WhatsAppPage = {
  async render() {
    document.getElementById('view').innerHTML = `
      <div class="card text-center" style="margin-top:20px;">
        <h2 style="color: var(--granata);">📱 WhatsApp</h2>
        <p style="margin:12px 0; color: var(--gray-500);">
          Prossimamente...<br>
          <small>Convocazioni e messaggi rapidi</small>
        </p>
      </div>
    `;
  }
};

// =====================================================================
// INIT
// =====================================================================
async function init() {
  const auth = await Auth.getCurrentUser();
  
  if (auth?.profile) {
    $('#app-header')?.classList.remove('hidden');
    $('#bottom-nav')?.classList.remove('hidden');
    const userNameEl = $('#user-name');
    if (userNameEl) {
      userNameEl.textContent = auth.profile.full_name || auth.user.email;
    }
    renderNav(auth.profile.role);
  } else {
    $('#app-header')?.classList.add('hidden');
    $('#bottom-nav')?.classList.add('hidden');
  }
  
  Router.resolve();
}

// Riascolta i cambiamenti di auth (login/logout)
db.auth.onAuthStateChange(() => init());

// Avvio
init();

// Esponi utility globalmente
window.toast = toast;
window.formatDate = formatDate;
window.formatTime = formatTime;