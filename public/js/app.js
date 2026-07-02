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
  toast(`Tema ${newTheme === 'dark' ? 'scuro ' : 'chiaro ☀️'} attivato`, 'success');
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
  $('#app-header')?.classList.add('hidden');
  $('#bottom-nav')?.classList.add('hidden');
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
    const managementItems = [
      { path: '/attendance', icon: '✅', label: 'Presenze' },
      { path: '/results', icon: '📊', label: 'Risultati' },
      { path: '/trainings', icon: '🏃', label: 'Allenamenti' },
      { path: '/championship', icon: '🏟️', label: 'Campionato' },
      { path: '/roster', icon: '👥', label: 'Rosa' },
      { path: '/stats', icon: '📈', label: 'Statistiche' }
    ];

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
  console.log('🔍 Init chiamato');
  const auth = await Auth.getCurrentUser();
  console.log(' Auth:', auth);
  
  if (auth?.user) {
    if (!auth.profile) {
      console.log('🔍 Utente senza profilo, verifico se è un mister...');
      try {
        const misterProfile = await Auth.ensureMisterProfile(auth.user);
        if (misterProfile) {
          console.log('✅ Profilo mister creato/verificato');
          const updatedAuth = await Auth.getCurrentUser();
          if (updatedAuth?.profile) {
            $('#app-header')?.classList.remove('hidden');
            $('#bottom-nav')?.classList.remove('hidden');
            const userNameEl = $('#user-name');
            if (userNameEl) {
              userNameEl.textContent = updatedAuth.profile.full_name || updatedAuth.user.email;
            }
            renderNav(updatedAuth.profile.role);
            Router.resolve();
            return;
          }
        } else {
          console.warn('️ Email non autorizzata come mister, logout...');
          await Auth.signOut();
          toast('Accesso non autorizzato. Contatta l\'amministratore.', 'error');
          $('#app-header')?.classList.add('hidden');
          $('#bottom-nav')?.classList.add('hidden');
          Router.navigate('/login');
          return;
        }
      } catch (err) {
        console.error('❌ Errore creazione profilo:', err);
        await Auth.signOut();
        toast('Errore durante l\'accesso: ' + err.message, 'error');
        Router.navigate('/login');
        return;
      }
    }
    
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

// ✅ Aspetta che la sessione sia caricata prima di init
db.auth.getSession().then(({ data: { session } }) => {
  console.log('📋 Sessione caricata:', session?.user?.email || 'nessuna');
  init();
});

db.auth.onAuthStateChange((event, session) => {
  console.log(' Auth state change:', event);
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    init();
  } else if (event === 'SIGNED_OUT') {
    Router.navigate('/login');
  }
});

// ✅ Listener migliorato: gestisce solo eventi specifici
db.auth.onAuthStateChange((event, session) => {
  console.log(' Auth state change:', event);
  
  // Solo SIGNED_OUT esplicito (quando l'utente fa logout)
  if (event === 'SIGNED_OUT') {
    console.log('👋 Logout effettuato');
    $('#app-header')?.classList.add('hidden');
    $('#bottom-nav')?.classList.add('hidden');
    Router.navigate('/login');
  }
  // TOKEN_REFRESHED: non fare nulla, la sessione resta attiva
  else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token aggiornato, sessione mantenuta');
  }
  // USER_UPDATED: aggiorna la UI se necessario
  else if (event === 'USER_UPDATED') {
    console.log('👤 Utente aggiornato');
    init();
  }
});

// Init iniziale
init();

// Esponi utility globali
window.toast = toast;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.$ = $;
window.$$ = $$;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.closeBottomSheet = closeBottomSheet;