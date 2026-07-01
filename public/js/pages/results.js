const ResultsPage = {
  currentMatchId: null,
  
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📊 Gestione Risultati</h2>
      
      <div class="card" style="background: rgba(245,158,11,0.08); border-left: 4px solid var(--warning); margin-bottom: 16px;">
        <div style="font-size: 13px; color: var(--gray-700);">
          💡 Clicca sul risultato per modificarlo. <br>
          Tempi vinti: 0-3 per squadra, somma massima 3. <br>
          Risultati possibili: 3-0, 2-1, 1-1, 1-2, 0-3
        </div>
      </div>

      <div id="results-list">
        <div class="spinner"></div>
      </div>

      <!-- Modale -->
      <div id="result-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px;">
        <div class="card" style="max-width: 400px; width: 100%;">
          <div class="flex-between mb-4">
            <h3 style="color: var(--granata);">📝 Inserisci Risultato</h3>
            <button class="icon-btn" id="close-result-modal" style="background: var(--gray-200); color: var(--gray-700);">✕</button>
          </div>
          
          <div id="match-info" style="text-align: center; margin-bottom: 16px; padding: 12px; background: var(--gray-50); border-radius: 8px;"></div>
          
          <form id="result-form">
            <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin: 20px 0;">
              <div style="flex: 1; text-align: center;">
                <label style="font-size: 12px; color: var(--gray-500); display: block; margin-bottom: 6px;">Casa</label>
                <input type="number" id="home-score" class="form-control" min="0" max="3" value="0" style="text-align: center; font-size: 24px; font-weight: 700;" />
              </div>
              <div style="font-size: 24px; color: var(--gray-500);">-</div>
              <div style="flex: 1; text-align: center;">
                <label style="font-size: 12px; color: var(--gray-500); display: block; margin-bottom: 6px;">Ospite</label>
                <input type="number" id="away-score" class="form-control" min="0" max="3" value="0" style="text-align: center; font-size: 24px; font-weight: 700;" />
              </div>
            </div>
            
            <div id="score-warning" class="hidden" style="background: rgba(220,38,38,0.1); border-left: 3px solid var(--danger); padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: var(--danger);">
              ⚠️ La somma dei tempi vinti deve essere massimo 3
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button type="button" id="btn-clear-result" class="btn btn-secondary" style="flex: 1;">🗑️ Rimuovi</button>
              <button type="submit" id="btn-save-result" class="btn btn-primary" style="flex: 1;">💾 Salva</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('close-result-modal').addEventListener('click', () => {
      document.getElementById('result-modal').classList.add('hidden');
    });

    const homeInput = document.getElementById('home-score');
    const awayInput = document.getElementById('away-score');
    const warning = document.getElementById('score-warning');
    const saveBtn = document.getElementById('btn-save-result');

    const validateSum = () => {
      const sum = parseInt(homeInput.value || 0) + parseInt(awayInput.value || 0);
      if (sum > 3) {
        warning.classList.remove('hidden');
        saveBtn.disabled = true;
      } else {
        warning.classList.add('hidden');
        saveBtn.disabled = false;
      }
    };

    homeInput.addEventListener('input', validateSum);
    awayInput.addEventListener('input', validateSum);

    document.getElementById('result-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveResult();
    });

    document.getElementById('btn-clear-result').addEventListener('click', async () => {
      if (!this.currentMatchId) return;
      if (!confirm('Rimuovere il risultato?')) return;
      
      try {
        const { error } = await db
          .from('matches')
          .update({ home_won_periods: null, away_won_periods: null })
          .eq('id', this.currentMatchId);
        
        if (error) throw error;
        toast('Risultato rimosso', 'success');
        document.getElementById('result-modal').classList.add('hidden');
        this.loadResults();
      } catch (err) {
        toast('Errore: ' + err.message, 'error');
      }
    });

    await this.loadResults();
  },

  async loadResults() {
    const container = document.getElementById('results-list');
    
    try {
      const { data: matches, error } = await db
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .order('match_type', { ascending: true })
        .order('matchday', { ascending: true })
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });
      
      if (error) throw error;
      
      if (!matches || matches.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessuna partita</p>';
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      // Raggruppa per giornata
      const groupedMatches = {};
      matches.forEach(m => {
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
          
          let scoreDisplay = '-';
          let resultBadge = '';
          
          if (hasResult) {
            scoreDisplay = `${m.home_won_periods} - ${m.away_won_periods}`;
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
          
          // ✅ LAYOUT VERTICALE
          html += `
            <div style="cursor: pointer; ${isPast && !hasResult ? 'opacity: 0.6;' : ''}" 
                onclick="ResultsPage.openResultModal('${m.id}', '${homeName}', '${awayName}', ${m.home_won_periods || 0}, ${m.away_won_periods || 0}, ${hasResult})">
              <!-- RIGA 1: Squadre -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                <span style="font-weight: 600; font-size: 14px; flex: 1; text-align: right; min-width: 80px;">${homeName}</span>
                <span style="font-size: 16px; font-weight: 700; color: var(--granata); min-width: 40px; text-align: center; ${!hasResult ? 'opacity: 0.3;' : ''}">${scoreDisplay}</span>
                <span style="font-weight: 600; font-size: 14px; flex: 1; text-align: left; min-width: 80px;">${awayName}</span>
                ${resultBadge}
              </div>
              <!-- RIGA 2: Data, ora -->
              <div style="text-align: center; font-size: 12px; color: var(--gray-500); display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                <span>📅 ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                ${m.match_time ? `<span>⏰ ${formatTime(m.match_time)}</span>` : ''}
              </div>
              ${!hasResult ? `<div style="text-align: center; margin-top: 6px; font-size: 11px; color: var(--warning);">👆 Clicca per inserire risultato</div>` : ''}
            </div>
          `;
        });
        
        html += `</div>`;
      });
      
      container.innerHTML = html;
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  openResultModal(matchId, homeName, awayName, homeScore, awayScore, hasResult) {
    this.currentMatchId = matchId;
    document.getElementById('match-info').innerHTML = `
      <div style="font-size: 13px; color: var(--gray-500); margin-bottom: 4px;">
        ${homeName} vs ${awayName}
      </div>
    `;

    document.getElementById('home-score').value = hasResult ? homeScore : 0;
    document.getElementById('away-score').value = hasResult ? awayScore : 0;
    document.getElementById('score-warning').classList.add('hidden');
    document.getElementById('btn-save-result').disabled = false;

    document.getElementById('result-modal').classList.remove('hidden');
  },

  async saveResult() {
    const homeScore = parseInt(document.getElementById('home-score').value || 0);
    const awayScore = parseInt(document.getElementById('away-score').value || 0);
    
    if (homeScore + awayScore > 3) {
      toast('La somma dei tempi vinti deve essere massimo 3', 'error');
      return;
    }

    if (homeScore < 0 || homeScore > 3 || awayScore < 0 || awayScore > 3) {
      toast('I valori devono essere tra 0 e 3', 'error');
      return;
    }

    try {
      const { error } = await db
        .from('matches')
        .update({
          home_won_periods: homeScore,
          away_won_periods: awayScore
        })
        .eq('id', this.currentMatchId);
      
      if (error) throw error;
      
      toast('Risultato salvato! La classifica si aggiornerà automaticamente.', 'success');
      document.getElementById('result-modal').classList.add('hidden');
      this.loadResults();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  }
};

window.ResultsPage = ResultsPage;