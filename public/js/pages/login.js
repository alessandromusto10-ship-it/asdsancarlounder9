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
            <button class="role-tab" data-role="genitore">👨‍👩‍👦 Genitore</button>
          </div>

          <!-- Form login -->
          <form id="login-form">
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
          </form>

          <!-- Google sign-in (solo per mister) -->
          <div id="google-section">
            <div class="divider">oppure</div>
            <button id="btn-google" class="btn btn-google btn-block">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Accedi con Google
            </button>
          </div>

          <div class="text-center mt-4">
            <a href="#/register" class="link">Registrati</a>
            <span style="color: var(--gray-300); margin: 0 8px;">·</span>
            <a href="#/reset" class="link">Password dimenticata?</a>
          </div>
        </div>
      </div>
    `;

    // Gestione tab
    let currentRole = 'mister';
    const tabs = view.querySelectorAll('.role-tab');
    const googleSection = view.querySelector('#google-section');
    
    const updateRoleUI = () => {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.role === currentRole));
      // Google visibile solo per mister
      googleSection.style.display = currentRole === 'mister' ? 'block' : 'none';
    };
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        currentRole = tab.dataset.role;
        updateRoleUI();
      });
    });
    updateRoleUI();

    // Submit form
    view.querySelector('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = view.querySelector('#login-email').value.trim();
      const password = view.querySelector('#login-password').value;
      const btn = e.target.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.textContent = 'Accesso in corso...';
      
      try {
        await Auth.signInWithEmail(email, password);
        
        // Verifica ruolo
        const { profile } = await Auth.getCurrentUser();
        if (currentRole === 'mister' && profile?.role !== 'mister') {
          await Auth.signOut();
          throw new Error('Questo account non è un mister. Usa la tab "Genitore".');
        }
        if (currentRole === 'genitore' && profile?.role !== 'genitore') {
          await Auth.signOut();
          throw new Error('Questo account non è un genitore. Usa la tab "Mister".');
        }
        
        toast('Benvenuto! 👋', 'success');
        Router.navigate('/');
      } catch (err) {
        toast(err.message || 'Errore di accesso', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Accedi';
      }
    });

    // Google
    view.querySelector('#btn-google').addEventListener('click', async () => {
      try {
        await Auth.signInWithGoogle();
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  }
};

window.LoginPage = LoginPage;