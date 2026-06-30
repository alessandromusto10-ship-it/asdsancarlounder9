const ChampionshipPage = {
  championshipId: null,
  filterType: 'all',

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">🏟️ Gestione Campionato</h2>

      <!-- Info Campionato -->
      <div class="card">
        <div class="card-title">📋 Info Campionato</div>
        <form id="championship-form">
          <div class="form-group">
            <label>🏆 Nome Campionato</label>
            <input type="text" id="champ-name" class="form-control" placeholder="Es: Campionato Under 9" required />
          </div>
          <div class="form-group">
            <label>📅 Stagione</label>
            <input type="text" id="champ-season" class="form-control" placeholder="Es: 2025-2026" />
          </div>
          <button type="submit" class="btn btn-primary btn-block">💾 Salva Info</button>
        </form>
      </div>

      <!-- Squadre del Girone -->
      <div class="card">
        <div class="card-title">👥 Squadre del Girone</div>
        <form id="team-form" style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="text" id="team-name" class="form-control" placeholder="Nome squadra" required style="flex: 1;" />
          <button type="submit" class="btn btn-primary">➕</button>
        </form>
        <div id="teams-list">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Aggiungi Partita -->
      <div class="card">
        <div class="card-title">⚽ Aggiungi Partita</div>
        <form id="match-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>📅 Giornata</label>
              <input type="number" id="match-day" class="form-control" min="1" placeholder="1" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>🏷️ Tipo</label>
              <select id="match-type" class="form-control" required>
                <option value="andata">🏁 ANDATA</option>
                <option value="ritorno">🔄 RITORNO</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>📅 Data</label>
              <input type="date" id="match-date" class="form-control" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>⏰ Orario</label>
              <input type="time" id="match-time" class="form-control" />
            </div>
          </div>
          <div class="form-group">
            <label>📍 Luogo</label>
            <input type="text" id="match-location" class="form-control" placeholder="Es: Campo San Carlo" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>🏠 Casa</label>
              <select id="match-home" class="form-control" required>
                <option value="">-- Seleziona --</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>✈️ Ospite</label>
              <select id="match-away" class="form-control" required>
                <option value="">-- Seleziona --</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>📊 Risultato (Tempi Vinti, es. 2-1)</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="number" id="match-home-score" class="form-control" min="0" max="3" placeholder="0" style="text-align: center;" />
              <span style="font-size: 20px; color: var(--gray-500);">-</span>
              <input type="number" id="match-away-score" class="form-control" min="0" max="3" placeholder="0" style="text-align: center;" />
            </div>
            <small style="color: var(--gray-500); display: block; margin-top: 4px;">
              💡 Lascia vuoto per salvare la partita senza risultato
            </small>
          </div>
          <button type="submit" class="btn btn-primary btn-block">💾 Salva Partita</button>
        </form>
      </div>

      <!-- Lista Partite -->
      <div class="card">
        <div class="card-title">📋 Lista Partite</div>
        <div class="role-tabs" style="margin-bottom: 12px;">
          <button class="role-tab active" data-filter="all">Tutte</button>
          <button class="role-tab" data-filter="andata">🏁 Andata</button>
          <button class="role-tab" data-filter="ritorno">🔄 Ritorno</button>
        </div>
        <div id="matches-list">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Modifica Partita -->
      <div id="edit-match-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px;">
        <div class="card" style="max-width: 450px; width: 100%; max-height: 90vh; overflow-y: auto;">
          <div class="flex-between mb-4">
            <h3 style="color: var(--granata);">✏️ Modifica Partita</h3>
            <button class="icon-btn" id="close-edit-match" style="background: var(--gray-200); color: var(--gray-700);">✕</button>
          </div>
          <form id="edit-match-form">
            <input type="hidden" id="edit-match-id" />
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label>📅 Giornata</label>
                <input type="number" id="edit-match-day" class="form-control" min="1" required />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>🏷️ Tipo</label>
                <select id="edit-match-type" class="form-control" required>
                  <option value="andata">🏁 ANDATA</option>
                  <option value="ritorno">🔄 RITORNO</option>
                </select>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label>📅 Data</label>
                <input type="date" id="edit-match-date" class="form-control" required />
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>⏰ Orario</label>
                <input type="time" id="edit-match-time" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>📍 Luogo</label>
              <input type="text" id="edit-match-location" class="form-control" />
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label>🏠 Casa</label>
                <select id="edit-match-home" class="form-control" required>
                  <option value="">-- Seleziona --</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>✈️ Ospite</label>
                <select id="edit-match-away" class="form-control" required>
                  <option value="">-- Seleziona --</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>📊 Risultato (lascia vuoto per rimuovere)</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="edit-match-home-score" class="form-control" min="0" max="3" style="text-align: center;" />
                <span style="font-size: 20px; color: var(--gray-500);">-</span>
                <input type="number" id="edit-match-away-score" class="form-control" min="0" max="3" style="text-align: center;" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">💾 Salva Modifiche</button>
          </form>
        </div>
      </div>

      <!-- Reset Campionato -->
      <div class="card" style="border: 2px solid var(--danger);">
        <div class="card-title" style="color: var(--danger);">🗑️ Reset Campionato</div>
        <p style="font-size: 13px; color: var(--gray-700); margin-bottom: 12px;">
          ⚠️ Questa azione eliminerà <strong>tutte le partite</strong> del campionato. Le squadre verranno mantenute.
        </p>
        <button id="btn-reset-matches" class="btn btn-block" style="background: var(--danger); color: var(--white);">
          🗑️ Elimina Tutte le Partite
        </button>
      </div>
    `;

    // Carica campionato esistente o creane uno nuovo
    await this.loadOrCreateChampionship();

    // Form campionato
    document.getElementById('championship-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveChampionship();
    });

    // Form squadra
    document.getElementById('team-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addTeam();
    });

    // Form partita
    document.getElementById('match-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addMatch();
    });

    // Filtri partite
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterType = btn.dataset.filter;
        this.loadMatches();
      });
    });

    // Modale close
    document.getElementById('close-edit-match').addEventListener('click', () => {
      document.getElementById('edit-match-modal').classList.add('hidden');
    });

    // Form modifica partita
    document.getElementById('edit-match-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updateMatch();
    });

    // Reset
    document.getElementById('btn-reset-matches').addEventListener('click', async () => {
      await this.resetMatches();
    });

    await this.loadTeams();
    await this.loadMatches();
  },

  async loadOrCreateChampionship() {
    try {
      const { data, error } = await db
        .from('championships')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        this.championshipId = data[0].id;
        document.getElementById('champ-name').value = data[0].name;
        document.getElementById('champ-season').value = data[0].season || '';
      } else {
        // Crea campionato di default
        const { data: newChamp, error: cErr } = await db
          .from('championships')
          .insert({ name: 'Campionato Under 9', season: '2025-2026' })
          .select()
          .single();
        
        if (cErr) throw cErr;
        this.championshipId = newChamp.id;
        document.getElementById('champ-name').value = newChamp.name;
        document.getElementById('champ-season').value = newChamp.season;
        toast('Campionato creato automaticamente', 'success');
      }
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async saveChampionship() {
    if (!this.championshipId) {
      toast('Nessun campionato selezionato', 'error');
      return;
    }
    
    const name = document.getElementById('champ-name').value.trim();
    const season = document.getElementById('champ-season').value.trim();
    
    try {
      const { error } = await db
        .from('championships')
        .update({ name, season })
        .eq('id', this.championshipId);
      
      if (error) throw error;
      toast('Campionato aggiornato! ✅', 'success');
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async loadTeams() {
    const container = document.getElementById('teams-list');
    
    try {
      const { data, error } = await db
        .from('teams')
        .select('*')
        .eq('championship_id', this.championshipId)
        .order('name');
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessuna squadra</p>';
      } else {
        container.innerHTML = data.map(t => `
          <div class="attendance-row">
            <div style="flex: 1; font-weight: 600;">${t.name}</div>
            <button class="icon-btn" onclick="ChampionshipPage.deleteTeam('${t.id}', '${t.name}')" 
                    style="background: var(--danger); color: var(--white); width: 32px; height: 32px; font-size: 14px;">🗑️</button>
          </div>
        `).join('');
      }
      
      // Aggiorna menu a tendina partite
      this.updateTeamSelects(data || []);
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  updateTeamSelects(teams) {
    const homeSelect = document.getElementById('match-home');
    const awaySelect = document.getElementById('match-away');
    const editHomeSelect = document.getElementById('edit-match-home');
    const editAwaySelect = document.getElementById('edit-match-away');
    
    const options = '<option value="">-- Seleziona --</option>' + 
      teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    
    homeSelect.innerHTML = options;
    awaySelect.innerHTML = options;
    editHomeSelect.innerHTML = options;
    editAwaySelect.innerHTML = options;
  },

  async addTeam() {
    const name = document.getElementById('team-name').value.trim();
    if (!name) return;
    
    try {
      const { error } = await db.from('teams').insert({
        championship_id: this.championshipId,
        name: name
      });
      
      if (error) throw error;
      toast('Squadra aggiunta! ✅', 'success');
      document.getElementById('team-name').value = '';
      await this.loadTeams();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async deleteTeam(id, name) {
    if (!confirm(`Eliminare la squadra "${name}"?`)) return;
    
    try {
      const { error } = await db.from('teams').delete().eq('id', id);
      if (error) throw error;
      toast('Squadra eliminata', 'success');
      await this.loadTeams();
      await this.loadMatches();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async addMatch() {
    const day = parseInt(document.getElementById('match-day').value);
    const type = document.getElementById('match-type').value;
    const date = document.getElementById('match-date').value;
    const time = document.getElementById('match-time').value || null;
    const location = document.getElementById('match-location').value.trim() || null;
    const homeId = document.getElementById('match-home').value;
    const awayId = document.getElementById('match-away').value;
    const homeScore = document.getElementById('match-home-score').value;
    const awayScore = document.getElementById('match-away-score').value;
    
    if (homeId === awayId) {
      toast('Casa e Ospite devono essere diverse', 'error');
      return;
    }
    
    const homeScoreNum = homeScore !== '' ? parseInt(homeScore) : null;
    const awayScoreNum = awayScore !== '' ? parseInt(awayScore) : null;
    
    if (homeScoreNum !== null && awayScoreNum !== null && homeScoreNum + awayScoreNum > 3) {
      toast('La somma dei tempi vinti deve essere massimo 3', 'error');
      return;
    }
    
    try {
      const { error } = await db.from('matches').insert({
        championship_id: this.championshipId,
        home_team_id: homeId,
        away_team_id: awayId,
        matchday: day,
        match_type: type,
        match_date: date,
        match_time: time,
        location: location,
        is_home: true,
        home_won_periods: homeScoreNum,
        away_won_periods: awayScoreNum
      });
      
      if (error) throw error;
      toast('Partita aggiunta! ✅', 'success');
      document.getElementById('match-form').reset();
      await this.loadMatches();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async loadMatches() {
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
        .eq('championship_id', this.championshipId)
        .order('match_date', { ascending: true })
        .order('matchday', { ascending: true });
      
      if (this.filterType !== 'all') {
        query = query.eq('match_type', this.filterType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessuna partita</p>';
        return;
      }
      
      container.innerHTML = data.map(m => {
        const dateObj = new Date(m.match_date);
        const homeName = m.home_team?.name || 'Casa';
        const awayName = m.away_team?.name || 'Ospite';
        const hasResult = m.home_won_periods !== null && m.away_won_periods !== null;
        const score = hasResult ? `${m.home_won_periods} - ${m.away_won_periods}` : '-';
        
        return `
          <div class="card" style="margin-bottom: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div style="font-size: 12px; color: var(--gray-500);">
                ${m.match_type === 'andata' ? '🏁' : '🔄'} Giornata ${m.matchday}
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="icon-btn" onclick="ChampionshipPage.openEditMatch('${m.id}')" 
                        style="background: var(--granata); color: var(--white); width: 28px; height: 28px; font-size: 12px;">✏️</button>
                <button class="icon-btn" onclick="ChampionshipPage.deleteMatch('${m.id}')" 
                        style="background: var(--danger); color: var(--white); width: 28px; height: 28px; font-size: 12px;">🗑️</button>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1; text-align: right; font-weight: 600; font-size: 13px;">${homeName}</div>
              <div style="padding: 0 10px; font-size: 16px; font-weight: 700; color: var(--granata); min-width: 50px; text-align: center;">${score}</div>
              <div style="flex: 1; text-align: left; font-weight: 600; font-size: 13px;">${awayName}</div>
            </div>
            <div style="text-align: center; margin-top: 6px; font-size: 11px; color: var(--gray-500);">
              📅 ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
              ${m.match_time ? ' · ⏰ ' + formatTime(m.match_time) : ''}
              ${m.location ? ' · 📍 ' + m.location : ''}
            </div>
          </div>
        `;
      }).join('');
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async openEditMatch(matchId) {
    try {
      const { data: match, error } = await db
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (error) throw error;
      if (!match) return;
      
      document.getElementById('edit-match-id').value = match.id;
      document.getElementById('edit-match-day').value = match.matchday;
      document.getElementById('edit-match-type').value = match.match_type;
      document.getElementById('edit-match-date').value = match.match_date;
      document.getElementById('edit-match-time').value = match.match_time || '';
      document.getElementById('edit-match-location').value = match.location || '';
      document.getElementById('edit-match-home').value = match.home_team_id;
      document.getElementById('edit-match-away').value = match.away_team_id;
      document.getElementById('edit-match-home-score').value = match.home_won_periods ?? '';
      document.getElementById('edit-match-away-score').value = match.away_won_periods ?? '';
      
      document.getElementById('edit-match-modal').classList.remove('hidden');
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async updateMatch() {
    const id = document.getElementById('edit-match-id').value;
    const homeId = document.getElementById('edit-match-home').value;
    const awayId = document.getElementById('edit-match-away').value;
    
    if (homeId === awayId) {
      toast('Casa e Ospite devono essere diverse', 'error');
      return;
    }
    
    const homeScore = document.getElementById('edit-match-home-score').value;
    const awayScore = document.getElementById('edit-match-away-score').value;
    const homeScoreNum = homeScore !== '' ? parseInt(homeScore) : null;
    const awayScoreNum = awayScore !== '' ? parseInt(awayScore) : null;
    
    if (homeScoreNum !== null && awayScoreNum !== null && homeScoreNum + awayScoreNum > 3) {
      toast('La somma dei tempi vinti deve essere massimo 3', 'error');
      return;
    }
    
    const data = {
      matchday: parseInt(document.getElementById('edit-match-day').value),
      match_type: document.getElementById('edit-match-type').value,
      match_date: document.getElementById('edit-match-date').value,
      match_time: document.getElementById('edit-match-time').value || null,
      location: document.getElementById('edit-match-location').value.trim() || null,
      home_team_id: homeId,
      away_team_id: awayId,
      home_won_periods: homeScoreNum,
      away_won_periods: awayScoreNum
    };
    
    try {
      const { error } = await db.from('matches').update(data).eq('id', id);
      if (error) throw error;
      
      toast('Partita aggiornata! ✅', 'success');
      document.getElementById('edit-match-modal').classList.add('hidden');
      await this.loadMatches();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async deleteMatch(matchId) {
    if (!confirm('Eliminare questa partita?')) return;
    
    try {
      const { error } = await db.from('matches').delete().eq('id', matchId);
      if (error) throw error;
      toast('Partita eliminata', 'success');
      await this.loadMatches();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async resetMatches() {
    if (!confirm('⚠️ ATTENZIONE: Questa azione eliminerà TUTTE le partite del campionato. Continuare?')) return;
    if (!confirm('Sei davvero sicuro? Questa azione è IRREVERSIBILE.')) return;
    
    try {
      const { error } = await db
        .from('matches')
        .delete()
        .eq('championship_id', this.championshipId);
      
      if (error) throw error;
      toast('Tutte le partite sono state eliminate', 'success');
      await this.loadMatches();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  }
};

window.ChampionshipPage = ChampionshipPage;