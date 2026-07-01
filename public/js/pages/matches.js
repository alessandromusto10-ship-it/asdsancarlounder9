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
      
      // Raggruppa per giornata
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
        
        html += `<div class="card" style="margin-bottom: 12px; padding: 12px;">`;
        
        group.matches.forEach((m, idx) => {
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
          
          if (idx > 0) {
            html += `<div style="border-top: 1px solid var(--gray-200); margin: 10px 0;"></div>`;
          }
          
          // ✅ LAYOUT VERTICALE: squadre sopra, data/ora sotto
          html += `
            <div style="${isPast && !hasResult ? 'opacity: 0.6;' : ''}">
              <!-- RIGA 1: Squadre -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                <span style="font-weight: 600; font-size: 14px; flex: 1; text-align: right; min-width: 80px;">${homeName}</span>
                <span style="font-size: 16px; font-weight: 700; color: var(--granata); min-width: 40px; text-align: center;">${score}</span>
                <span style="font-weight: 600; font-size: 14px; flex: 1; text-align: left; min-width: 80px;">${awayName}</span>
                ${resultBadge}
              </div>
              <!-- RIGA 2: Data, ora, luogo -->
              <div style="text-align: center; font-size: 12px; color: var(--gray-500); display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <span>📅 ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                ${m.match_time ? `<span>⏰ ${formatTime(m.match_time)}</span>` : ''}
                ${m.location ? `<span>📍 ${m.location}</span>` : ''}
              </div>
            </div>
          `;
        });
        
        html += `</div>`;
      });
      
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.MatchesPage = MatchesPage;