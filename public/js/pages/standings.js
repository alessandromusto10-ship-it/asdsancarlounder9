const StandingsPage = {
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">🥇 Classifica (Tempi Vinti)</h2>
      
      <div class="card" style="background: rgba(122,31,46,0.05); border-left: 4px solid var(--granata); margin-bottom: 16px;">
        <div style="font-size: 13px; color: var(--gray-700);">
          💡 La classifica è basata sui <strong>tempi vinti</strong> (non punti classici).<br>
          Risultati possibili: 3-0, 2-1, 1-1, 1-2, 0-3
        </div>
      </div>

      <div id="standings-container">
        <div class="spinner"></div>
      </div>

      <div class="card mt-4">
        <div class="card-title">📊 Legenda</div>
        <div style="font-size: 13px; color: var(--gray-700); line-height: 1.8;">
          <div><strong>PG</strong> = Partite Giocate</div>
          <div><strong>TV</strong> = Tempi Vinti (totale)</div>
          <div><strong>TP</strong> = Tempi Persi (totale)</div>
          <div><strong>DT</strong> = Differenza Tempi (TV - TP)</div>
          <div><strong>V</strong> = Vittorie</div>
          <div><strong>P</strong> = Pareggi</div>
          <div><strong>S</strong> = Sconfitte</div>
        </div>
      </div>
    `;

    await this.loadStandings();
  },

  async loadStandings() {
    const container = document.getElementById('standings-container');
    
    try {
      // Carica tutte le squadre
      const { data: teams, error: tErr } = await db
        .from('teams')
        .select('id, name')
        .order('name');
      
      if (tErr) throw tErr;
      if (!teams || teams.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessuna squadra registrata</p>';
        return;
      }
      
      // Carica tutte le partite con risultato
      const { data: matches, error: mErr } = await db
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_won_periods,
          away_won_periods
        `)
        .not('home_won_periods', 'is', null)
        .not('away_won_periods', 'is', null);
      
      if (mErr) throw mErr;
      
      // Calcola statistiche per ogni squadra
      const standings = {};
      teams.forEach(t => {
        standings[t.id] = {
          id: t.id,
          name: t.name,
          pg: 0,
          tv: 0,
          tp: 0,
          dt: 0,
          v: 0,
          p: 0,
          s: 0
        };
      });
      
      if (matches) {
        matches.forEach(m => {
          const home = standings[m.home_team_id];
          const away = standings[m.away_team_id];
          
          if (!home || !away) return;
          
          home.pg++;
          away.pg++;
          
          home.tv += m.home_won_periods;
          home.tp += m.away_won_periods;
          away.tv += m.away_won_periods;
          away.tp += m.home_won_periods;
          
          home.dt = home.tv - home.tp;
          away.dt = away.tv - away.tp;
          
          if (m.home_won_periods > m.away_won_periods) {
            home.v++;
            away.s++;
          } else if (m.home_won_periods < m.away_won_periods) {
            home.s++;
            away.v++;
          } else {
            home.p++;
            away.p++;
          }
        });
      }
      
      // Ordina: TV desc, DT desc, V desc
      const sorted = Object.values(standings).sort((a, b) => {
        if (b.tv !== a.tv) return b.tv - a.tv;
        if (b.dt !== a.dt) return b.dt - a.dt;
        return b.v - a.v;
      });
      
      // Render tabella
      let html = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Squadra</th>
                <th style="text-align: center;">PG</th>
                <th style="text-align: center; color: #fbbf24;">TV</th>
                <th style="text-align: center;">TP</th>
                <th style="text-align: center;">DT</th>
                <th style="text-align: center; color: #4ade80;">V</th>
                <th style="text-align: center;">P</th>
                <th style="text-align: center; color: #f87171;">S</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      sorted.forEach((team, idx) => {
        const position = idx + 1;
        const isSanCarlo = team.name === this.SANCARLO_TEAM_NAME;
        
        // Stile per S. Carlo Milano: evidenziato
        let rowStyle = '';
        let nameStyle = '';
        let posHtml = position;
        
        if (isSanCarlo) {
          rowStyle = 'background: rgba(122,31,46,0.08); font-weight: 700;';
          nameStyle = 'color: var(--granata); font-weight: 700;';
          posHtml = `<span style="color: var(--granata);">⭐ ${position}</span>`;
        } else if (position === 1) {
          rowStyle = 'background: linear-gradient(90deg, rgba(251,191,36,0.1), transparent);';
        } else if (position === 2) {
          rowStyle = 'background: linear-gradient(90deg, rgba(192,192,192,0.1), transparent);';
        } else if (position === 3) {
          rowStyle = 'background: linear-gradient(90deg, rgba(205,127,50,0.1), transparent);';
        }
        
        html += `
          <tr style="${rowStyle}">
            <td style="text-align: center; font-weight: 700;">${posHtml}</td>
            <td style="${nameStyle}">${isSanCarlo ? '⭐ ' : ''}${team.name}</td>
            <td style="text-align: center;">${team.pg}</td>
            <td style="text-align: center; font-weight: 700; color: #f59e0b;">${team.tv}</td>
            <td style="text-align: center;">${team.tp}</td>
            <td style="text-align: center; color: ${team.dt > 0 ? 'var(--success)' : team.dt < 0 ? 'var(--danger)' : 'var(--gray-500)'};">
              ${team.dt > 0 ? '+' : ''}${team.dt}
            </td>
            <td style="text-align: center; color: var(--success); font-weight: 600;">${team.v}</td>
            <td style="text-align: center;">${team.p}</td>
            <td style="text-align: center; color: var(--danger); font-weight: 600;">${team.s}</td>
          </tr>
        `;
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
      
      container.innerHTML = html;
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.StandingsPage = StandingsPage;