// ✅ Mostra la settimana corrente (lunedì-domenica) basata sulla data odierna
async loadWeekForMonth() {
  const container = document.getElementById('week-events');
  const { data: teamData, error: tErr } = await db
    .from('teams')
    .select('id')
    .eq('name', 'S. Carlo Milano')
    .single();
  
  if (tErr || !teamData) {
    container.innerHTML = '<p style="color: var(--danger);">Errore nel caricamento della squadra</p>';
    return;
  }
  
  const sanCarloId = teamData.id;
  
  // ✅ Calcola la settimana corrente (lunedì-domenica)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Domenica, 1=Lunedì, ..., 6=Sabato
  
  // Vai al lunedì della settimana corrente
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  const startStr = this.formatDate(monday);
  const endStr = this.formatDate(sunday);
  
  console.log(`📅 Settimana corrente: dal ${startStr} al ${endStr}`);
  
  // Recupera ALLENAMENTI della settimana
  const { data: trainings, error: trErr } = await db
    .from('trainings')
    .select('*')
    .gte('date', startStr)
    .lte('date', endStr);
  
  // Recupera PARTITE della settimana
  const { data: matches, error: mErr } = await db
    .from('matches')
    .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
    .gte('match_date', startStr)
    .lte('match_date', endStr)
    .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`);
  
  if (trErr) console.error('Errore trainings:', trErr);
  if (mErr) console.error('Errore matches:', mErr);
  
  // Unisci eventi
  const events = [];
  
  if (trainings && trainings.length > 0) {
    trainings.forEach(t => {
      events.push({ type: 'training', data: t, date: t.date });
    });
  }
  
  if (matches && matches.length > 0) {
    matches.forEach(m => {
      const matchDate = m.match_date || m.date;
      events.push({ type: 'match', data: m, date: matchDate });
    });
  }
  
  // Ordina per data
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  console.log(`📊 Totale eventi questa settimana: ${events.length}`);
  
  if (events.length > 0) {
    this.renderWeekEvents(events);
  } else {
    container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessun evento questa settimana</p>';
  }
}