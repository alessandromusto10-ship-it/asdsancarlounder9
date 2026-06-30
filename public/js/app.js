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
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
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
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

initTheme();

// ===== INSTALL PWA =====
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('#install-banner')?.classList.remove('hidden');
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

// ===== LOGOUT & TEMA =====
$('#btn-logout')?.addEventListener('click', async () => {
  await Auth.signOut();
  Router.navigate('/login');
});
$('#btn-theme')?.addEventListener('click', toggleTheme);

// ===== BOTTOM SHEET (Menu Gestione) =====
function openBottomSheet() {
  $('#bottom-sheet-overlay')?.classList.add('show');
  $('#bottom-sheet')?.classList.add('show');
  document.querySelector('.nav-item-gear')?.classList.add('open');
}

function closeBottomSheet() {
  $('#bottom-sheet-overlay')?.classList.remove('show');
  $('#bottom-sheet')?.classList.remove('show');
  document.querySelector('.nav-item-gear')?.classList.remove('open');
}

$('#bottom-sheet-overlay')?.addEventListener('click', closeBottomSheet);
$('#bottom-sheet-close')?.addEventListener('click', closeBottomSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeBottomSheet(); });

// ===== NAV DINAMICA =====
function renderNav(role) {
  const nav = $('#bottom-nav');
  if (!nav) return;

  if (role === 'mister') {
    // Elementi dentro il menu Gestione (ORDINE RICHIESTO)
    const managementItems = [
      { path: '/attendance', icon: '✅', label: 'Presenze' },
      { path: '/roster', icon: '👥', label: 'Rosa' },
      { path: '/trainings', icon: '🏃', label: 'Allenamenti' },
      { path: '/results', icon: '📊', label: 'Risultati' },
      { path: '/championship', icon: '🏟️', label: 'Campionato' },
      { path: '/stats', icon: '📈', label: 'Statistiche' }
    ];

    // Renderizza contenuto bottom sheet (layout verticale)
    const sheetContent = $('#bottom-sheet-content');
    if (sheetContent) {
      sheetContent.innerHTML = managementItems.map(item => `
        <div class="bottom-sheet-item" data-path="${item.path}">
          <span class="bottom-sheet-item-icon">${item.icon}</span>
          <span class="bottom-sheet-item-label">${item.label}</span>
        </div>
      `).join('');
      
      sheetContent.querySelectorAll('.bottom-sheet-item').forEach(item => {
        item.addEventListener('click', () => {
          closeBottomSheet();
          Router.navigate(item.dataset.path);
        });
      });
    }

    // Nav principale: 6 voci
    nav.innerHTML = `
      <button class="nav-item" data-path="/" onclick="Router.navigate('/')">
        <span class="nav-icon">🏠</span><span>Home</span>
      </button>
      <button class="nav-item" data-path="/calendar" onclick="Router.navigate('/calendar')">
        <span class="nav-icon">📅</span><span>Calendario</span>
      </button>
      <button class="nav-item" data-path="/matches" onclick="Router.navigate('/matches')">
        <span class="nav-icon">⚽</span><span>Partite</span>
      </button>
      <button class="nav-item" data-path="/standings" onclick="Router.navigate('/standings')">
        <span class="nav-icon">🥇</span><span>Classifica</span>
      </button>
      <button class="nav-item nav-item-gear" id="btn-gear">
        <span class="nav-icon">⚙️</span><span>Gestione</span>
      </button>
      <button class="nav-item" data-path="/whatsapp" onclick="Router.navigate('/whatsapp')">
        <span class="nav-icon">📱</span><span>WhatsApp</span>
      </button>
    `;

    $('#btn-gear')?.addEventListener('click', openBottomSheet);

  } else {
    // Genitori: 6 voci
    nav.innerHTML = `
      <button class="nav-item" data-path="/" onclick="Router.navigate('/')">
        <span class="nav-icon">🏠</span><span>Home</span>
      </button>
      <button class="nav-item" data-path="/calendar" onclick="Router.navigate('/calendar')">
        <span class="nav-icon">📅</span><span>Calendario</span>
      </button>
      <button class="nav-item" data-path="/matches" onclick="Router.navigate('/matches')">
        <span class="nav-icon">⚽</span><span>Partite</span>
      </button>
      <button class="nav-item" data-path="/standings" onclick="Router.navigate('/standings')">
        <span class="nav-icon">🥇</span><span>Classifica</span>
      </button>
      <button class="nav-item" data-path="/attendance" onclick="Router.navigate('/attendance')">
        <span class="nav-icon">✅</span><span>Presenze</span>
      </button>
      <button class="nav-item" data-path="/whatsapp" onclick="Router.navigate('/whatsapp')">
        <span class="nav-icon">📱</span><span>WhatsApp</span>
      </button>
    `;
  }
}

// ===== REGISTRAZIONE ROUTES =====
Router.register('/login', () => LoginPage.render());
Router.register('/register', () => RegisterPage.render());
Router.register('/reset', () => ResetPage.render());
Router.register('/', () => HomePage.render());
Router.register('/calendar', () => CalendarPage.render());
Router.register('/matches', () => MatchesPage.render());
Router.register('/standings', () => StandingsPage.render());
Router.register('/attendance', () => AttendancePage.render());
Router.register('/stats', () => StatsPage.render());
Router.register('/whatsapp', () => WhatsAppPage.render());
Router.register('/trainings', () => TrainingsPage.render());
Router.register('/results', () => ResultsPage.render());
Router.register('/roster', () => RosterPage.render());
Router.register('/championship', () => ChampionshipPage.render());

// ===== INIT =====
async function init() {
  const auth = await Auth.getCurrentUser();
  if (auth?.profile) {
    $('#app-header')?.classList.remove('hidden');
    $('#bottom-nav')?.classList.remove('hidden');
    const userNameEl = $('#user-name');
    if (userNameEl) userNameEl.textContent = auth.profile.full_name || auth.user.email;
    renderNav(auth.profile.role);
  } else {
    $('#app-header')?.classList.add('hidden');
    $('#bottom-nav')?.classList.add('hidden');
  }
  Router.resolve();
}

db.auth.onAuthStateChange(() => init());
init();

// Esponi utility
window.toast = toast;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.$ = $;
window.$$ = $$;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.closeBottomSheet = closeBottomSheet;