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
        .order('matchday', { ascending: true })
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });
      
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
      
      // Raggruppa per giornata e tipo (andata/ritorno)
      const groupedMatches = {};
      data.forEach(m => {
        const key = `${m.match_type}-${m.matchday}`;
        if (!groupedMatches[key]) {
          groupedMatches[key] = {
            type: m.match_type,
            matchday: m.matchday,
            matches: []
          };
        }
        groupedMatches[key].matches.push(m);
      });
      
      // Ordina le giornate
      const sortedKeys = Object.keys(groupedMatches).sort((a, b) => {
        const [typeA, dayA] = a.split('-');
        const [typeB, dayB] = b.split('-');
        if (typeA !== typeB) return typeA === 'andata' ? -1 : 1;
        return parseInt(dayA) - parseInt(dayB);
      });
      
      let html = '';
      
      sortedKeys.forEach(key => {
        const group = groupedMatches[key];
        const typeLabel = group.type === 'andata' ? 'Andata' : 'Ritorno';
        const typeIcon = group.type === 'andata' ? '🏁' : '🔄';
        
        html += `
          <h3 style="color: var(--granata); margin: 20px 0 12px; font-size: 16px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid var(--granata); padding-bottom: 6px;">
            ${typeIcon} ${group.matchday}ª Giornata ${typeLabel}
          </h3>
        `;
        
        group.matches.forEach(m => {
          const dateObj = new Date(m.match_date);
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
            <div class="card" style="margin-bottom: 8px; ${isPast && !hasResult ? 'opacity: 0.6;' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-size: 12px; color: var(--gray-500);">
                  ${typeIcon} ${group.matchday}ª ${typeLabel}
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
      });
      
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.MatchesPage = MatchesPage;