// Configurazione Supabase
// IMPORTANTE: sostituisci con le tue variabili reali
const SUPABASE_URL = 'https://ydcxrzdlmrprvhefnctj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkY3hyemRsbXJwcnZoZWZuY3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NzA4NTgsImV4cCI6MjA5ODM0Njg1OH0.biD9OJkHEXnt-dlNwjvGse54cqhQy7Bm0BSVuIMmXWU';

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