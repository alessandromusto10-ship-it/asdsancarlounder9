// ===== UTILITY GLOBALI =====
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

// ===== GESTIONE TEMA =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', defaultTheme);
    localStorage.setItem('theme', defaultTheme);
  }
  
  updateThemeIcon();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  updateThemeIcon();
  toast(`Tema ${newTheme === 'dark' ? 'scuro 🌙' : 'chiaro ☀️'} attivato`, 'success');
}

function updateThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const btn = document.getElementById('btn-theme');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// Inizializza tema subito
initTheme();

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

// ===== TOGGLE TEMA =====
$('#btn-theme')?.addEventListener('click', toggleTheme);

// ===== NAV DINAMICA =====
function renderNav(role) {
  const nav = $('#bottom-nav');
  if (!nav) return;
  
  const common = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/calendar', icon: '📅', label: 'Calendario' },
    { path: '/matches', icon: '⚽', label: 'Partite' },
    { path: '/standings', icon: '🥇', label: 'Classifica' },
    { path: '/attendance', icon: '✅', label: 'Presenze' }
  ];
  
  const misterExtra = [
    { path: '/roster', icon: '👥', label: 'Rosa' },
    { path: '/championship', icon: '🏟️', label: 'Campionato' },
    { path: '/trainings', icon: '🏃', label: 'Allenam.' },
    { path: '/results', icon: '📊', label: 'Risultati' },
    { path: '/stats', icon: '📈', label: 'Statistiche' },
    { path: '/whatsapp', icon: '📱', label: 'WhatsApp' }
  ];
  
  const items = role === 'mister' ? [...common, ...misterExtra] : common;
  
  if (role === 'mister') {
    nav.innerHTML = `
      <div style="display: flex; justify-content: space-around; width: 100%; padding-bottom: 4px; border-bottom: 1px solid var(--gray-200);">
        ${common.map(i => `
          <button class="nav-item" data-path="${i.path}" onclick="Router.navigate('${i.path}')">
            <span class="nav-icon">${i.icon}</span>
            <span>${i.label}</span>
          </button>
        `).join('')}
      </div>
      <div style="display: flex; justify-content: space-around; width: 100%; padding-top: 4px;">
        ${misterExtra.map(i => `
          <button class="nav-item" data-path="${i.path}" onclick="Router.navigate('${i.path}')">
            <span class="nav-icon">${i.icon}</span>
            <span>${i.label}</span>
          </button>
        `).join('')}
      </div>
    `;
  } else {
    nav.innerHTML = items.map(i => `
      <button class="nav-item" data-path="${i.path}" onclick="Router.navigate('${i.path}')">
        <span class="nav-icon">${i.icon}</span>
        <span>${i.label}</span>
      </button>
    `).join('');
  }
}

// ===== REGISTRAZIONE ROUTES =====

// --- Pagine pubbliche ---
Router.register('/login', () => LoginPage.render());
Router.register('/register', () => RegisterPage.render());
Router.register('/reset', () => ResetPage.render());

// --- Pagine comuni ---
Router.register('/', () => HomePage.render());
Router.register('/calendar', () => CalendarPage.render());
Router.register('/matches', () => MatchesPage.render());
Router.register('/standings', () => StandingsPage.render());
Router.register('/attendance', () => AttendancePage.render());

// --- Pagine solo mister ---
Router.register('/trainings', () => TrainingsPage.render());
Router.register('/results', () => ResultsPage.render());
Router.register('/roster', () => RosterPage.render());
Router.register('/championship', () => ChampionshipPage.render());
Router.register('/stats', () => StatsPage.render());
Router.register('/whatsapp', () => WhatsAppPage.render());

// ===== INIT =====
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

db.auth.onAuthStateChange(() => init());
init();

// Esponi utility globali
window.toast = toast;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.$ = $;
window.$$ = $$;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;