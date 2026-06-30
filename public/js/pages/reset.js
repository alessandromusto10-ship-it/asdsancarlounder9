const ResetPage = {
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <div class="login-container">
        <div class="login-box">
          <img src="/icons/logo.svg" alt="Logo" class="login-logo" />
          <h1 class="login-title">🔑 Reset Password</h1>
          <p class="login-subtitle">Ti invieremo un link per reimpostare la password</p>

          <form id="reset-form">
            <div class="form-group">
              <label>Email</label>
              <input type="email" id="reset-email" class="form-control" 
                     placeholder="tua@email.it" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              Invia email reset
            </button>
          </form>

          <div class="text-center mt-4">
            <a href="#/login" class="link">← Torna al login</a>
          </div>
        </div>
      </div>
    `;

    view.querySelector('#reset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = view.querySelector('#reset-email').value.trim();
      const btn = e.target.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.textContent = 'Invio...';
      
      try {
        await Auth.resetPassword(email);
        toast('Email inviata! Controlla la tua casella.', 'success');
        setTimeout(() => Router.navigate('/login'), 2500);
      } catch (err) {
        toast(err.message || 'Errore', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Invia email reset';
      }
    });
  }
};

window.ResetPage = ResetPage;