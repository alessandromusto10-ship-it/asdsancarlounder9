// ===== DEBUG MODE =====
console.log('🚀 App.js caricato');

try {
  // ===== UTILITY GLOBALI =====
  function toast(msg, type = '') {
    console.log('📢 Toast:', msg);
    const t = document.getElementById('toast');
    if (!t) {
      console.error('❌ Elemento #toast non trovato');
      return;
    }
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

  console.log('✅ Utility caricate');

  // ===== GESTIONE TEMA =====
  function initTheme() {
    console.log('🎨 Inizializzazione tema...');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
      console.log('✅ Tema caricato da localStorage:', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      console.log('✅ Tema default impostato: light');
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
  console.log('✅ Tema inizializzato');

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

  console.log('✅ PWA install configurato');

  // ===== LOGOUT =====
  $('#btn-logout')?.addEventListener('click', async () => {
    await Auth.signOut();
    Router.navigate('/login');
  });

  // ===== TOGGLE TEMA =====
  $('#btn-theme')?.addEventListener('click', toggleTheme);

  console.log('✅ Event listeners configurati');

  // ===== BOTTOM SHEET =====
  function openBottomSheet() {
    console.log('📂 Apertura bottom sheet');
    const overlay = $('#bottom-sheet-overlay');
    const sheet = $('#bottom-sheet');
    const gearBtn = document.querySelector('.nav-item-gear');
    
    if (overlay && sheet) {
      overlay.classList.add('show');
      sheet.classList.add('show');
      if (gearBtn) gearBtn.classList.add('open');
    } else {
      console.error('❌ Elementi bottom sheet non trovati');
    }
  }

  function closeBottomSheet() {
    console.log('📪 Chiusura bottom sheet');
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

  console.log('✅ Bottom sheet configurato');

  // ===== NAV DINAMICA =====
  function renderNav(role) {
    console.log('🧭 Rendering nav per ruolo:', role);
    const nav = $('#bottom-nav');
    if (!nav) {
      console.error('❌ Elemento #bottom-nav non trovato');
      return;
    }
    
    if (role === 'mister') {
      console.log('⚙️ Nav mister con bottom sheet');
      
      const managementItems = [
        { path: '/roster', icon: '👥', label: 'Rosa' },
        { path: '/championship', icon: '🏟️', label: 'Campionato' },
        { path: '/trainings', icon: '🏃', label: 'Allenamenti' },
        { path: '/results', icon: '📊', label: 'Risultati' }
      ];
      
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
        console.log('✅ Bottom sheet content renderizzato');
      } else {
        console.error('❌ Elemento #bottom-sheet-content non trovato');
      }
      
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
      console.log('✅ Nav mister renderizzata');
      
    } else {
      console.log('👨‍👩‍👦 Nav genitori');
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
      console.log('✅ Nav genitori renderizzata');
    }
  }

  console.log('✅ Funzione renderNav definita');

  // ===== REGISTRAZIONE ROUTES =====
  console.log('📝 Registrazione routes...');

  try {
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
    console.log('✅ Routes registrate');
  } catch (err) {
    console.error('❌ Errore registrazione routes:', err);
  }

  // ===== INIT =====
  async function init() {
    console.log('🚀 Init app...');
    
    try {
      const auth = await Auth.getCurrentUser();
      console.log('✅ Auth caricato:', auth);
      
      if (auth?.profile) {
        console.log('✅ Profilo trovato:', auth.profile);
        $('#app-header')?.classList.remove('hidden');
        $('#bottom-nav')?.classList.remove('hidden');
        const userNameEl = $('#user-name');
        if (userNameEl) {
          userNameEl.textContent = auth.profile.full_name || auth.user.email;
        }
        renderNav(auth.profile.role);
      } else {
        console.log('⚠️ Nessun profilo, redirect a login');
        $('#app-header')?.classList.add('hidden');
        $('#bottom-nav')?.classList.add('hidden');
      }
      
      Router.resolve();
      console.log('✅ Init completato');
    } catch (err) {
      console.error('❌ Errore in init():', err);
    }
  }

  console.log('✅ Funzione init definita');

  db.auth.onAuthStateChange(() => {
    console.log('🔄 Auth state changed');
    init();
  });

  init();
  console.log('✅ Init chiamato');

  // Esponi utility globali
  window.toast = toast;
  window.formatDate = formatDate;
  window.formatTime = formatTime;
  window.$ = $;
  window.$$ = $$;
  window.toggleTheme = toggleTheme;
  window.initTheme = initTheme;
  window.closeBottomSheet = closeBottomSheet;

  console.log('✅ App.js caricato completamente!');

} catch (error) {
  console.error('💥 ERRORE CRITICO in app.js:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; color: #c00; font-family: monospace;">
      <h1>💥 Errore JavaScript</h1>
      <pre>${error.message}\n\n${error.stack}</pre>
    </div>
  `;
}