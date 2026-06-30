// Configurazione Supabase
// IMPORTANTE: sostituisci con le tue variabili reali
const SUPABASE_URL = 'https://TUO-PROGETTO.supabase.co';
const SUPABASE_ANON_KEY = 'TUA-ANON-KEY';

if (typeof supabase === 'undefined') {
  console.error('Supabase client non caricato');
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

window.db = db;