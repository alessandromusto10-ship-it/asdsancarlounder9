const LoginPage = {
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <div class="login-container">
        <div class="login-box">
          <img src="/icons/logo.svg" alt="Logo" class="login-logo" />
          <h1 class="login-title">ASD San Carlo Milano</h1>
          <p class="login-subtitle">Gestione Squadra Under 9</p>

          <!-- Tab ruolo -->
          <div class="role-tabs">
            <button class="role-tab active" data-role="mister">⚽ Mister</button>
            <button class="role-tab" data-role="genitore">‍👩‍👦 Genitore</button>
          </div>

          <form id="login-form">
            <!-- Campi email/password (solo per genitori) -->
            <div id="email-section">
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="login-email" class="form-control" 
                       placeholder="tua@email.it" required autocomplete="email" />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" id="login-password" class="form-control" 
                       placeholder="••••••••" required autocomplete="current-password" />
              </div>
              <button type="submit" class="btn btn-primary btn-block">
                Accedi
              </button>
            </div>

            <!-- Sezione solo Google per mister -->
            <div id="google-only-section" class="hidden">
              <div style="text-align: center; padding: 20px 0;">
                <p style="font-size: 14px; color: var(--gray-700); margin-bottom: 16px;">
                   L'accesso per i Mister è riservato esclusivamente tramite Google.
                </p>
                <p style="font-size: 13px; color: var(--gray-500); margin-bottom: 20px;">
                  Usa l'account Google autorizzato per accedere.
                </p>
              </div>
            </div>

            <div class="divider">oppure</div>

            <button type="button" id="btn-google-login" class="btn btn-google btn-block">
              <svg width="18" height="18" viewBox="0 0 48 48" style="margin-right: 8px;">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Accedi con Google
            </button>
          </form>

          <div class="login-links">
            <a href="#/register" class="link">Registrati</a>
            <span class="separator">·</span>
            <a href="#/reset" class="link">Password dimenticata?</a>
          </div>
        </div>
      </div>
    `;

    let currentRole = 'mister';
    const tabs = view.querySelectorAll('.role-tab');
    const emailSection = view.querySelector('#email-section');
    const googleOnlySection = view.querySelector('#google-only-section');
    const loginForm = view.querySelector('#login-form');

    const updateRoleUI = () => {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.role === currentRole));
      
      if (currentRole === 'mister') {
        // Per i mister: nascondi email/password, mostra solo Google
        emailSection.classList.add('hidden');
        googleOnlySection.classList.remove('hidden');
        // Nascondi i campi required per non bloccare il form
        view.querySelector('#login-email').required = false;
        view.querySelector('#login-password').required = false;
      } else {
        // Per i genitori: mostra email/password
        emailSection.classList.remove('hidden');
        googleOnlySection.classList.add('hidden');
        view.querySelector('#login-email').required = true;
        view.querySelector('#login-password').required = true;
      }
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        currentRole = tab.dataset.role;
        updateRoleUI();
      });
    });

    // Submit email/password (solo per genitori)
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Se è selezionato "mister", ignora il submit del form email
      if (currentRole === 'mister') return;
      
      const email = view.querySelector('#login-email').value.trim();
      const password = view.querySelector('#login-password').value;
      const btn = e.target.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.textContent = 'Accesso...';
      
      try {
        await Auth.signInWithEmail(email, password);
        toast('Accesso effettuato! ✅', 'success');
      } catch (err) {
        toast('Errore: ' + (err.message || 'Credenziali non valide'), 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Accedi';
      }
    });

    // Login Google (per entrambi i ruoli)
    view.querySelector('#btn-google-login').addEventListener('click', async () => {
      const btn = view.querySelector('#btn-google-login');
      btn.disabled = true;
      btn.textContent = 'Accesso in corso...';
      
      try {
        await Auth.signInWithGoogle();
        // Il redirect a Google gestirà il resto
        // Al ritorno, l'evento onAuthStateChange in app.js gestirà il profilo
      } catch (err) {
        toast('Errore: ' + (err.message || 'Login Google fallito'), 'error');
        btn.disabled = false;
        btn.textContent = 'Accedi con Google';
      }
    });

    updateRoleUI();
  }
};

window.LoginPage = LoginPage;