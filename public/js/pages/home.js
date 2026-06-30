const HomePage = {
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',

  async render() {
    const view = document.getElementById('view');
    const { profile } = await Auth.getCurrentUser();
    const isMister = profile.role === 'mister';

    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">🏠 Home</h2>

      <!-- Prossime Partite -->
      <div class="card">
        <div class="card-title">⚽ Prossime Partite</div>
        <div id="upcoming-matches">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Ultimi Risultati -->
      <div class="card">
        <div class="card-title">📊 Ultimi Risultati</div>
        <div id="recent-results">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Info rapide (solo mister) -->
      ${isMister ? `
        <div class="card" style="background: rgba(122,31,46,0.05); border-left: 4px solid var(--granata);">
          <div class="card-title" style="margin-bottom: 8px;">🔧 Gestione Rapida</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button class="btn btn-secondary" onclick="Router.navigate('/trainings')" style="font-size: 13px; padding: 10px;">
              🏃 Allenamenti
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('/attendance')" style="font-size: 13px; padding: 10px;">
              ✅ Presenze
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('/whatsapp')" style="font-size: 13px; padding: 10px;">
              📱 WhatsApp
            </button>
            <button class="btn btn-secondary" onclick="Router.navigate('/roster')" style="font-size: 13px; padding: 10px;">
              👥 Rosa
            </button>
          </div>
        </div>
      ` : ''}
    `;

    await this.loadUpcomingMatches();
    await this.loadRecentResults();
  },

  async loadUpcomingMatches() {
    const container = document.getElementById('upcoming-matches');
    
    try {
      // Trova l'ID della squadra S. Carlo Milano
      const { data: teamData, error: tErr } = await db
        .from('teams')
        .select('id')
        .eq('name', this.SANCARLO_TEAM_NAME)
        .single();
      
      if (tErr || !teamData) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Squadra non trovata</p>';
        return;
      }
      
      const sanCarloId = teamData.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Carica partite future dove S. Carlo è casa o ospite
      const { data: matches, error } = await db
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .gte('match_date', today)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`)
        .order('match_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      
      if (!matches || matches.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessuna partita in programma</p>';
        return;
      }
      
      container.innerHTML = matches.map(m => {
        const dateObj = new Date(m.match_date);
        const isHome = m.home_team_id === sanCarloId;
        const opponent = isHome ? m.away_team?.name : m.home_team?.name;
        const location = isHome ? 'Casa' : 'Trasferta';
        
        return `
          <div class="card" style="margin-bottom: 8px; padding: 12px; background: var(--gray-50);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--granata); font-size: 14px;">
                  ${m.match_type === 'andata' ? '🏁' : '🔄'} Giornata ${m.matchday}
                </div>
                <div style="font-size: 13px; margin-top: 4px;">
                  <strong>${isHome ? 'S. Carlo Milano' : opponent}</strong> 
                  <span style="color: var(--gray-500);">vs</span> 
                  <strong>${isHome ? opponent : 'S. Carlo Milano'}</strong>
                </div>
                <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">
                  📅 ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
                  ${m.match_time ? ' · ⏰ ' + formatTime(m.match_time) : ''}
                  ${m.location ? ' · 📍 ' + m.location : ''}
                  · <span style="color: var(--granata); font-weight: 600;">${location}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async loadRecentResults() {
    const container = document.getElementById('recent-results');
    
    try {
      // Trova l'ID della squadra S. Carlo Milano
      const { data: teamData, error: tErr } = await db
        .from('teams')
        .select('id')
        .eq('name', this.SANCARLO_TEAM_NAME)
        .single();
      
      if (tErr || !teamData) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Squadra non trovata</p>';
        return;
      }
      
      const sanCarloId = teamData.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Carica partite passate con risultato dove S. Carlo è casa o ospite
      const { data: matches, error } = await db
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .lt('match_date', today)
        .not('home_won_periods', 'is', null)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`)
        .order('match_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      if (!matches || matches.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessun risultato disponibile</p>';
        return;
      }
      
      container.innerHTML = matches.map(m => {
        const dateObj = new Date(m.match_date);
        const isHome = m.home_team_id === sanCarloId;
        const opponent = isHome ? m.away_team?.name : m.home_team?.name;
        
        // Calcola risultato dal punto di vista di S. Carlo
        const sanCarloScore = isHome ? m.home_won_periods : m.away_won_periods;
        const opponentScore = isHome ? m.away_won_periods : m.home_won_periods;
        
        let resultBadge = '';
        if (sanCarloScore > opponentScore) {
          resultBadge = '<span class="badge badge-success">VITTORIA</span>';
        } else if (sanCarloScore < opponentScore) {
          resultBadge = '<span class="badge badge-danger">SCONFITTA</span>';
        } else {
          resultBadge = '<span class="badge badge-warning">PAREGGIO</span>';
        }
        
        return `
          <div class="card" style="margin-bottom: 8px; padding: 12px; background: var(--gray-50);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 12px; color: var(--gray-500);">
                ${m.match_type === 'andata' ? '🏁' : '🔄'} G${m.matchday} · ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
              </div>
              ${resultBadge}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1; text-align: right; font-weight: 600; font-size: 13px; ${isHome ? 'color: var(--granata);' : ''}">
                ${m.home_team?.name || 'Casa'}
              </div>
              <div style="padding: 0 12px; font-size: 18px; font-weight: 700; color: var(--granata); min-width: 60px; text-align: center;">
                ${m.home_won_periods} - ${m.away_won_periods}
              </div>
              <div style="flex: 1; text-align: left; font-weight: 600; font-size: 13px; ${!isHome ? 'color: var(--granata);' : ''}">
                ${m.away_team?.name || 'Ospite'}
              </div>
            </div>
          </div>
        `;
      }).join('');
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.HomePage = HomePage;