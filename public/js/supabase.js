// Configurazione Supabase
const SUPABASE_URL = 'https://ydcxrzdlmrprvhefnctj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3hyemRsbXJwcnZoZWZuY3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NzA4NTgsImV4cCI6MjA5ODM0Njg1OH0.biD9OJkHEXnt-dlNwjvGse54cqhQy7Bm0BSVuIMmXWU';

if (typeof supabase === 'undefined') {
  console.error('Supabase client non caricato');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // ✅ Sessione persistente in localStorage (non si perde chiudendo l'app)
    storage: localStorage,
    storageKey: 'supabase.auth.token'
  }
});

window.db = db;

// ✅ Controlla se c'è una sessione attiva all'avvio
db.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    console.log('✅ Sessione attiva trovata:', session.user.email);
  } else {
    console.log('ℹ️ Nessuna sessione attiva, richiesta login');
  }
});