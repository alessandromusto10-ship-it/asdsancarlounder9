const RegisterPage = {
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <div class="login-container">
        <div class="login-box">
          <img src="/icons/logo.svg" alt="Logo" class="login-logo" />
          <h1 class="login-title"> Registrazione</h1>
          <p class="login-subtitle">Crea il tuo account</p>

          <!-- Tab ruolo -->
          <div class="role-tabs">
            <button class="role-tab active" data-role="mister">⚽ Mister</button>
            <button class="role-tab" data-role="genitore">‍👩‍👦 Genitore</button>
          </div>

          <form id="register-form">
            <div class="form-group">
              <label>Nome completo</label>
              <input type="text" id="reg-name" class="form-control" 
                     placeholder="Mario Rossi" required />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="reg-email" class="form-control" 
                     placeholder="tua@email.it" required autocomplete="email" />
            </div>
            <div class="form-group">
              <label>Password (minimo 6 caratteri)</label>
              <input type="password" id="reg-password" class="form-control" 
                     placeholder="••••••••" required minlength="6" 
                     autocomplete="new-password" />
            </div>

            <!-- Campo figlio (solo per genitori) -->
            <div id="player-section" class="hidden">
              <div class="form-group">
                <label>👦 Seleziona tuo figlio</label>
                <select id="reg-player" class="form-control" required>
                  <option value="">-- Seleziona --</option>
                </select>
                <div id="player-loading" class="text-center mt-2 hidden">
                  <div class="spinner" style="width:20px;height:20px;margin:8px auto;"></div>
                </div>
                <small style="color: var(--gray-500); display:block; margin-top:6px;">
                   Se non vedi il nome, contatta il mister.
                </small>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              Registrati
            </button>
          </form>

          <div class="text-center mt-4">
            <a href="#/login" class="link">← Torna al login</a>
          </div>
        </div>
      </div>
    `;

    let currentRole = 'mister';
    const tabs = view.querySelectorAll('.role-tab');
    const playerSection = view.querySelector('#player-section');
    const playerSelect = view.querySelector('#reg-player');
    const playerLoading = view.querySelector('#player-loading');
    let playersLoaded = false;

    const updateRoleUI = async () => {
      tabs.forEach(t => t.classList.toggle('active', t.dataset.role === currentRole));
      
      if (currentRole === 'genitore') {
        playerSection.classList.remove('hidden');
        playerSelect.required = true;
        if (!playersLoaded) await loadPlayers();
      } else {
        playerSection.classList.add('hidden');
        playerSelect.required = false;
      }
    };

    // Carica giocatori con ALMENO UNO SLOT LIBERO
    const loadPlayers = async () => {
      playerLoading.classList.remove('hidden');
      playerSelect.innerHTML = '<option value="">-- Seleziona --</option>';
      
      try {
        // Query: prendi giocatori dove parent_id È NULL oppure parent_id_2 È NULL
        const { data, error } = await db
          .from('players')
          .select('id, first_name, last_name')
          .or('parent_id.is.null,parent_id_2.is.null')
          .order('last_name')
          .order('first_name');
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          playerSelect.innerHTML = '<option value="">Nessun giocatore disponibile</option>';
        } else {
          data.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.last_name} ${p.first_name}`;
            playerSelect.appendChild(opt);
          });
        }
        playersLoaded = true;
      } catch (err) {
        toast('Errore caricamento giocatori: ' + err.message, 'error');
      } finally {
        playerLoading.classList.add('hidden');
      }
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        currentRole = tab.dataset.role;
        updateRoleUI();
      });
    });

    // Submit
    view.querySelector('#register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = view.querySelector('#reg-name').value.trim();
      const email = view.querySelector('#reg-email').value.trim();
      const password = view.querySelector('#reg-password').value;
      const playerId = playerSelect.value;
      const btn = e.target.querySelector('button[type="submit"]');
      
      if (currentRole === 'genitore' && !playerId) {
        return toast('Seleziona tuo figlio', 'error');
      }
      
      btn.disabled = true;
      btn.textContent = 'Registrazione...';
      
      try {
        await Auth.signUp(email, password, name, currentRole, playerId || null);
        toast('Registrazione completata! Ora puoi accedere. ✅', 'success');
        setTimeout(() => Router.navigate('/login'), 2000);
      } catch (err) {
        toast(err.message || 'Errore registrazione', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Registrati';
      }
    });

    updateRoleUI();
  }
};

window.RegisterPage = RegisterPage;