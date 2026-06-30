const HomePage = {
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',

  async render() {
    const view = document.getElementById('view');
    const { profile } = await Auth.getCurrentUser();
    view.innerHTML = `
      <div class="card" style="background: linear-gradient(135deg, var(--granata), var(--granata-dark)); color: var(--white);">
        <h2 style="font-size: 20px; margin-bottom: 4px;">👋 Ciao ${profile.full_name}!</h2>
        <p style="opacity: 0.9; font-size: 14px;">ASD San Carlo Milano - Under 9</p>
      </div>

      <div id="widget-next-training" class="card">
        <div class="card-title">🏃 Prossimo Allenamento</div>
        <div class="spinner"></div>
      </div>

      <div id="widget-next-match" class="card">
        <div class="card-title">⚽ Prossima Partita</div>
        <div class="spinner"></div>
      </div>

      <div id="widget-last-results" class="card">
        <div class="card-title">🏆 Ultimi Risultati</div>
        <div class="spinner"></div>
      </div>
    `;

    await Promise.all([
      this.loadNextTraining(),
      this.loadNextMatch(),
      this.loadLastResults()
    ]);
  },

  async loadNextTraining() {
    const container = document.getElementById('widget-next-training');
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await db
        .from('trainings')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="card-title">🏃 Prossimo Allenamento</div>
          <p style="color: var(--gray-500); text-align: center; padding: 12px;">
            Nessun allenamento programmato
          </p>
        `;
        return;
      }

      const t = data[0];
      const dateObj = new Date(t.date);
      const daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
      let countdown = '';
      if (daysUntil === 0) countdown = '<span class="badge badge-warning">OGGI</span>';
      else if (daysUntil === 1) countdown = '<span class="badge badge-warning">DOMANI</span>';
      else countdown = `<span class="badge badge-granata">tra ${daysUntil} giorni</span>`;

      container.innerHTML = `
        <div class="card-title">🏃 Prossimo Allenamento</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 18px; font-weight: 700; color: var(--granata);">
              ${dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
            <div style="margin-top: 4px; color: var(--gray-700);">
              ⏰ ${formatTime(t.time)} ${t.location ? '· 📍 ' + t.location : ''}
            </div>
          </div>
          ${countdown}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async loadNextMatch() {
    const container = document.getElementById('widget-next-match');
    try {
      // Trova l'ID della squadra S. Carlo Milano
      const { data: teamData, error: tErr } = await db
        .from('teams')
        .select('id')
        .eq('name', this.SANCARLO_TEAM_NAME)
        .single();

      if (tErr || !teamData) {
        container.innerHTML = `
          <div class="card-title"> Prossima Partita</div>
          <p style="color: var(--gray-500); text-align: center; padding: 12px;">
            Squadra non trovata
          </p>
        `;
        return;
      }

      const sanCarloId = teamData.id;
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await db
        .from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .gte('match_date', today)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="card-title">⚽ Prossima Partita</div>
          <p style="color: var(--gray-500); text-align: center; padding: 12px;">
            Nessuna partita in programma
          </p>
        `;
        return;
      }

      const m = data[0];
      const dateObj = new Date(m.match_date);
      const daysUntil = Math.ceil((dateObj - new Date()) / (1000 * 60 * 60 * 24));
      let countdown = '';
      if (daysUntil === 0) countdown = '<span class="badge badge-warning">OGGI</span>';
      else if (daysUntil === 1) countdown = '<span class="badge badge-warning">DOMANI</span>';
      else countdown = `<span class="badge badge-granata">tra ${daysUntil} giorni</span>`;

      const homeName = m.home_team?.name || 'Casa';
      const awayName = m.away_team?.name || 'Ospite';

      container.innerHTML = `
        <div class="card-title">⚽ Prossima Partita</div>
        <div style="text-align: center;">
          <div style="font-size: 13px; color: var(--gray-500); margin-bottom: 8px;">
            ${m.match_type === 'andata' ? '🏁 Andata' : '🔄 Ritorno'} · Giornata ${m.matchday || '?'}
          </div>
          <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 12px 0;">
            <div style="flex: 1; text-align: right; font-weight: 600;">${homeName}</div>
            <div style="font-size: 20px; color: var(--granata); font-weight: 700;">VS</div>
            <div style="flex: 1; text-align: left; font-weight: 600;">${awayName}</div>
          </div>
          <div style="color: var(--gray-700); font-size: 14px;">
            📅 ${dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}
            ${m.match_time ? ' ·  ' + formatTime(m.match_time) : ''}
          </div>
          ${m.location ? `<div style="color: var(--gray-500); font-size: 13px; margin-top: 4px;">📍 ${m.location}</div>` : ''}
          <div style="margin-top: 8px;">${countdown}</div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async loadLastResults() {
    const container = document.getElementById('widget-last-results');
    try {
      // Trova l'ID della squadra S. Carlo Milano
      const { data: teamData, error: tErr } = await db
        .from('teams')
        .select('id')
        .eq('name', this.SANCARLO_TEAM_NAME)
        .single();

      if (tErr || !teamData) {
        container.innerHTML = `
          <div class="card-title">🏆 Ultimi Risultati</div>
          <p style="color: var(--gray-500); text-align: center; padding: 12px;">
            Squadra non trovata
          </p>
        `;
        return;
      }

      const sanCarloId = teamData.id;
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await db
        .from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .lte('match_date', today)
        .not('home_won_periods', 'is', null)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`)
        .order('match_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="card-title"> Ultimi Risultati</div>
          <p style="color: var(--gray-500); text-align: center; padding: 12px;">
            Nessun risultato disponibile
          </p>
        `;
        return;
      }

      const resultsHtml = data.map(m => {
        const dateObj = new Date(m.match_date);
        const homeName = m.home_team?.name || 'Casa';
        const awayName = m.away_team?.name || 'Ospite';
        const score = `${m.home_won_periods ?? '-'} - ${m.away_won_periods ?? '-'}`;

        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
            <div style="flex: 1;">
              <div style="font-size: 11px; color: var(--gray-500);">
                ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · G${m.matchday || '?'}
              </div>
              <div style="font-weight: 600; font-size: 14px; margin-top: 2px;">
                ${homeName} vs ${awayName}
              </div>
            </div>
            <div style="font-size: 18px; font-weight: 700; color: var(--granata); min-width: 50px; text-align: center;">
              ${score}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="card-title">🏆 Ultimi Risultati</div>
        ${resultsHtml}
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.HomePage = HomePage;