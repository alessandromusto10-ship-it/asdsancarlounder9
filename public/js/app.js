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
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

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

// ===== BOTTOM SHEET (Menu Gestione) - ORIZZONTALE =====
function openBottomSheet() {
  const overlay = $('#bottom-sheet-overlay');
  const sheet = $('#bottom-sheet');
  const gearBtn = document.querySelector('.nav-item-gear');
  
  if (overlay && sheet) {
    overlay.classList.add('show');
    sheet.classList.add('show');
    if (gearBtn) gearBtn.classList.add('open');
  }
}

function closeBottomSheet() {
  const overlay = $('#bottom-sheet-overlay');
  const sheet = $('#bottom-sheet');
  const gearBtn = document.querySelector('.nav-item-gear');
  
  if (overlay && sheet) {
    overlay.classList.remove('show');
    sheet.classList.remove('show');
    if (gearBtn) gearBtn.classList.remove('open');
  }
}

$('#bottom-sheet-overlay')?.addEventListener('click', closeBottomSheet);
$('#bottom-sheet-close')?.addEventListener('click', closeBottomSheet);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBottomSheet();
});

// ===== NAV DINAMICA =====
function renderNav(role) {
  const nav = $('#bottom-nav');
  if (!nav) return;
  
  if (role === 'mister') {
    // Voci di gestione (nel bottom sheet orizzontale)
    const managementItems = [
      { path: '/roster', icon: '👥', label: 'Rosa' },
      { path: '/championship', icon: '🏟️', label: 'Campionato' },
      { path: '/trainings', icon: '🏃', label: 'Allenamenti' },
      { path: '/results', icon: '📊', label: 'Risultati' }
    ];
    
    // Renderizza bottom sheet orizzontale
    const sheetContent = $('#bottom-sheet-content');
    if (sheetContent) {
      sheetContent.innerHTML = managementItems.map(item => `
        <div class="bottom-sheet-item" data-path="${item.path}">
          <div class="bottom-sheet-item-icon">${item.icon}</div>
          <div class="bottom-sheet-item-label">${item.label}</div>
        </div>
      `).join('');
      
      sheetContent.querySelectorAll('.bottom-sheet-item').forEach(item => {
        item.addEventListener('click', () => {
          const path = item.dataset.path;
          closeBottomSheet();
          Router.navigate(path);
        });
      });
    }
    
    // Nav principale: Home, Calendario, Partite, Gestione, Classifica, Presenze, Statistiche, WhatsApp
    nav.innerHTML = `
      <button class="nav-item" data-path="/" onclick="Router.navigate('/')">
        <span class="nav-icon">🏠</span>
        <span>Home</span>
      </button>
      <button class="nav-item" data-path="/calendar" onclick="Router.navigate('/calendar')">
        <span class="nav-icon">📅</span>
        <span>Calendario</span>
      </button>
      <button class="nav-item" data-path="/matches" onclick="Router.navigate('/matches')">
        <span class="nav-icon">⚽</span>
        <span>Partite</span>
      </button>
      <button class="nav-item nav-item-gear" id="btn-gear">
        <span class="nav-icon">⚙️</span>
        <span>Gestione</span>
      </button>
      <button class="nav-item" data-path="/standings" onclick="Router.navigate('/standings')">
        <span class="nav-icon">🥇</span>
        <span>Classifica</span>
      </button>
      <button class="nav-item" data-path="/attendance" onclick="Router.navigate('/attendance')">
        <span class="nav-icon">✅</span>
        <span>Presenze</span>
      </button>
      <button class="nav-item" data-path="/stats" onclick="Router.navigate('/stats')">
        <span class="nav-icon">📈</span>
        <span>Statistiche</span>
      </button>
      <button class="nav-item" data-path="/whatsapp" onclick="Router.navigate('/whatsapp')">
        <span class="nav-icon">📱</span>
        <span>WhatsApp</span>
      </button>
    `;
    
    $('#btn-gear')?.addEventListener('click', openBottomSheet);
    
  } else {
    // Genitori: Home, Calendario, Partite, Classifica, Presenze, Statistiche, WhatsApp
    nav.innerHTML = `
      <button class="nav-item" data-path="/" onclick="Router.navigate('/')">
        <span class="nav-icon">🏠</span>
        <span>Home</span>
      </button>
      <button class="nav-item" data-path="/calendar" onclick="Router.navigate('/calendar')">
        <span class="nav-icon">📅</span>
        <span>Calendario</span>
      </button>
      <button class="nav-item" data-path="/matches" onclick="Router.navigate('/matches')">
        <span class="nav-icon">⚽</span>
        <span>Partite</span>
      </button>
      <button class="nav-item" data-path="/standings" onclick="Router.navigate('/standings')">
        <span class="nav-icon">🥇</span>
        <span>Classifica</span>
      </button>
      <button class="nav-item" data-path="/attendance" onclick="Router.navigate('/attendance')">
        <span class="nav-icon">✅</span>
        <span>Presenze</span>
      </button>
      <button class="nav-item" data-path="/stats" onclick="Router.navigate('/stats')">
        <span class="nav-icon">📈</span>
        <span>Statistiche</span>
      </button>
      <button class="nav-item" data-path="/whatsapp" onclick="Router.navigate('/whatsapp')">
        <span class="nav-icon">📱</span>
        <span>WhatsApp</span>
      </button>
    `;
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
Router.register('/stats', () => StatsPage.render());
Router.register('/whatsapp', () => WhatsAppPage.render());

// --- Pagine solo mister (nel bottom sheet) ---
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
    if (userNameEl) {
      userNameEl.textContent = auth