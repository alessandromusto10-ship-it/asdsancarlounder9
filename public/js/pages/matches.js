const MatchesPage = {
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">🏆 Calendario Partite</h2>
      
      <div class="role-tabs" style="margin-bottom: 16px;">
        <button class="role-tab active" data-filter="all">Tutte</button>
        <button class="role-tab" data-filter="andata">Andata</button>
        <button class="role-tab" data-filter="ritorno">Ritorno</button>
      </div>

      <div id="matches-list">
        <div class="spinner"></div>
      </div>
    `;

    let currentFilter = 'all';
    const tabs = view.querySelectorAll('.role-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        this.loadMatches(currentFilter);
      });
    });

    await this.loadMatches('all');
  },

  async loadMatches(filter) {
    const container = document.getElementById('matches-list');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
      let query = db
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .order('match_date', { ascending: true })
        .order('matchday', { ascending: true });
      
      if (filter !== 'all') {
        query = query.eq('match_type', filter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="card text-center">
            <p style="color: var(--gray-500); padding: 20px;">
              📭 Nessuna partita ${filter !== 'all' ? 'di ' + filter : ''} in programma
            </p>
          </div>
        `;
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      let html = '';
      let currentMonth = null;
      
      data.forEach(m => {
        const dateObj = new Date(m.match_date);
        const monthKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
        
        if (monthKey !== currentMonth) {
          currentMonth = monthKey;
          html += `<h3 style="color: var(--granata); margin: 16px 0 8px; font-size: 14px; text-transform: uppercase;">${dateObj.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h3>`;
        }
        
        const homeName = m.home_team?.name || 'Casa';
        const awayName = m.away_team?.name || 'Ospite';
        const hasResult = m.home_won_periods !== null && m.away_won_periods !== null;
        const isPast = m.match_date < today;
        const score = hasResult ? `${m.home_won_periods} - ${m.away_won_periods}` : 'vs';
        
        let resultBadge = '';
        if (hasResult) {
          if (m.home_won_periods > m.away_won_periods) {
            resultBadge = '<span class="badge badge-success">V</span>';
          } else if (m.home_won_periods < m.away_won_periods) {
            resultBadge = '<span class="badge badge-danger">S</span>';
          } else {
            resultBadge = '<span class="badge badge-warning">P</span>';
          }
        }
        
        html += `
          <div class="card" style="${isPast && !hasResult ? 'opacity: 0.6;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div style="font-size: 12px; color: var(--gray-500);">
                ${m.match_type === 'andata' ? '🏁' : '🔄'} Giornata ${m.matchday || '?'}
              </div>
              ${resultBadge}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1; text-align: right; font-weight: 600; font-size: 14px;">${homeName}</div>
              <div style="padding: 0 12px; font-size: 18px; font-weight: 700; color: var(--granata); min-width: 60px; text-align: center;">${score}</div>
              <div style="flex: 1; text-align: left; font-weight: 600; font-size: 14px;">${awayName}</div>
            </div>
            <div style="text-align: center; margin-top: 8px; font-size: 12px; color: var(--gray-500);">
              📅 ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
              ${m.match_time ? ' · ⏰ ' + formatTime(m.match_time) : ''}
              ${m.location ? ' · 📍 ' + m.location : ''}
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.MatchesPage = MatchesPage;