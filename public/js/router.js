const Router = {
  routes: {},
  current: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  async resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const path = hash.split('?')[0];
    const auth = await Auth.getCurrentUser();
    const profile = auth?.profile;

    // Pagine pubbliche
    const publicPages = ['/login', '/register', '/reset'];
    
    if (!profile && !publicPages.includes(path)) {
      return this.navigate('/login');
    }

    if (profile && publicPages.includes(path)) {
      return this.navigate('/');
    }

    // Blocco pagine mister per genitori
    if (profile?.role === 'genitore') {
      const misterOnly = ['/roster', '/championship', '/results', '/stats', '/whatsapp', '/management'];
      if (misterOnly.includes(path)) {
        toast('Accesso riservato ai mister', 'error');
        return this.navigate('/');
      }
    }

    const handler = this.routes[path];
    if (handler) {
      this.current = path;
      try {
        await handler();
      } catch (err) {
        console.error('Errore rendering pagina:', err);
        document.getElementById('view').innerHTML = `
          <div class="card text-center" style="margin-top:40px;">
            <h2>⚠️ Errore</h2>
            <p style="margin:12px 0;">${err.message}</p>
            <button class="btn btn-primary" onclick="Router.navigate('/')">Torna alla home</button>
          </div>
        `;
      }
      this.updateNav();
    } else {
      this.navigate(profile ? '/' : '/login');
    }
  },

  updateNav() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.path === this.current);
    });
  }
};

window.addEventListener('hashchange', () => Router.resolve());
window.Router = Router;