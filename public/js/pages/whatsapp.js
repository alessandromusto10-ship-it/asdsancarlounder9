const WhatsAppPage = {
  selectedPlayers: new Set(),
  currentConvocationId: null,

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📱 WhatsApp Convocazioni</h2>

      <!-- Selezione Match & Dettagli -->
      <div class="card">
        <div class="card-title">🏟️ Dettagli Convocazione</div>
        <form id="convocation-form">
          <div class="form-group">
            <label>⚽ Seleziona Partita</label>
            <select id="conv-match" class="form-control" required>
              <option value="">-- Seleziona partita --</option>
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>📅 Data</label>
              <input type="date" id="conv-date" class="form-control" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>📍 Luogo</label>
              <input type="text" id="conv-location" class="form-control" placeholder="Es: Campo San Carlo" />
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>⏰ Orario Ritrovo</label>
              <input type="time" id="conv-meeting" class="form-control" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>⚽ Orario Inizio</label>
              <input type="time" id="conv-kickoff" class="form-control" required />
            </div>
          </div>
          <div class="form-group">
            <label> Divisa / Kit</label>
            <input type="text" id="conv-kit" class="form-control" value="Maglia granata, pantaloncini neri, calzettoni granata" />
          </div>
          <div class="form-group">
            <label>🎒 Cosa Portare</label>
            <input type="text" id="conv-bring" class="form-control" placeholder="Es: Parastinchi, acqua, cambio" />
          </div>
          <div class="form-group">
            <label>📝 Note (opzionale)</label>
            <textarea id="conv-notes" class="form-control" rows="2" placeholder="Es: Portare certificato medico"></textarea>
          </div>
        </form>
      </div>

      <!-- Selezione Convocati -->
      <div class="card">
        <div class="flex-between mb-4">
          <div class="card-title" style="margin-bottom: 0;">👇 Convocati</div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-select-all" class="btn btn-ghost" style="font-size: 12px; padding: 4px 8px;">✅ Tutti</button>
            <button id="btn-deselect-all" class="btn btn-ghost" style="font-size: 12px; padding: 4px 8px;">❌ Nessuno</button>
          </div>
        </div>
        <div id="conv-players-list" style="max-height: 200px; overflow-y: auto;">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Anteprima & Azioni -->
      <div class="card">
        <div class="card-title">📱 Anteprima Messaggio</div>
        <textarea id="msg-preview" class="form-control" rows="8" readonly style="font-family: monospace; font-size: 13px; background: var(--gray-50);"></textarea>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
          <button id="btn-save-conv" class="btn btn-secondary">💾 Salva Bozza</button>
          <button id="btn-copy-msg" class="btn btn-secondary">📋 Copia</button>
        </div>
        <button id="btn-open-wa" class="btn btn-primary btn-block" style="margin-top: 8px;">📲 Apri WhatsApp</button>
        <small style="display: block; text-align: center; margin-top: 6px; color: var(--gray-500); font-size: 11px;">
          ℹ️ Apre sempre WhatsApp normale (non Business)
        </small>
      </div>

      <!-- Messaggi Rapidi -->
      <div class="card">
        <div class="card-title">⚡ Messaggi Rapidi</div>
        <div id="quick-msgs-list"></div>
      </div>
    `;

    // Event Listeners
    document.getElementById('conv-match').addEventListener('change', (e) => this.loadExistingConvocation(e.target.value));
    document.getElementById('conv-date').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-location').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-meeting').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-kickoff').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-kit').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-bring').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-notes').addEventListener('input', () => this.updatePreview());

    document.getElementById('btn-select-all').addEventListener('click', () => this.toggleAllPlayers(true));
    document.getElementById('btn-deselect-all').addEventListener('click', () => this.toggleAllPlayers(false));
    document.getElementById('btn-save-conv').addEventListener('click', () => this.saveConvocation());
    document.getElementById('btn-copy-msg').addEventListener('click', () => this.copyMessage());
    document.getElementById('btn-open-wa').addEventListener('click', () => this.openWhatsApp());

    // Caricamento iniziale
    await this.loadMatches();
    await this.loadPlayers();
    this.renderQuickMessages();
    this.updatePreview();
  },

  async loadMatches() {
    const select = document.getElementById('conv-match');
    try {
      const { data, error } = await db
        .from('matches')
        .select(`
          id, matchday, match_type, match_date, 
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name)
        `)
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date', { ascending: true });
      
      if (error) throw error;
      
      let html = '<option value="">-- Seleziona partita --</option>';
      data?.forEach(m => {
        const date = new Date(m.match_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        const typeLabel = m.match_type === 'andata' ? '🏁' : '🔄';
        html += `<option value="${m.id}">${typeLabel} G${m.matchday} · ${m.home_team?.name || '?'} vs ${m.away_team?.name || '?'} (${date})</option>`;
      });
      select.innerHTML = html;
    } catch (err) {
      toast('Errore caricamento partite: ' + err.message, 'error');
    }
  },

  async loadPlayers() {
    const container = document.getElementById('conv-players-list');
    try {
      const { data, error } = await db
        .from('players')
        .select('id, first_name, last_name, role')
        .order('last_name')
        .order('first_name');
      
      if (error) throw error;
      
      this.selectedPlayers.clear();
      if (data) data.forEach(p => this.selectedPlayers.add(p.id));
      
      container.innerHTML = data?.map(p => `
        <label style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--gray-200); cursor: pointer;">
          <input type="checkbox" class="player-cb" value="${p.id}" checked style="width: 18px; height: 18px; accent-color: var(--granata);" />
          <span style="flex: 1; font-weight: 500;">${p.last_name} ${p.first_name}</span>
          <span style="font-size: 11px; color: var(--gray-500); text-transform: capitalize;">${p.role || 'N.D.'}</span>
        </label>
      `).join('') || '<p style="color: var(--gray-500); text-align: center;">Nessun giocatore</p>';

      container.querySelectorAll('.player-cb').forEach(cb => {
        cb.addEventListener('change', () => {
          if (cb.checked) this.selectedPlayers.add(cb.value);
          else this.selectedPlayers.delete(cb.value);
          this.updatePreview();
        });
      });
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async loadExistingConvocation(matchId) {
    if (!matchId) return;
    
    document.getElementById('conv-date').value = '';
    document.getElementById('conv-location').value = '';
    document.getElementById('conv-meeting').value = '';
    document.getElementById('conv-kickoff').value = '';
    document.getElementById('conv-notes').value = '';
    this.selectedPlayers.clear();
    this.currentConvocationId = null;
    
    try {
      const { data, error } = await db
        .from('convocations')
        .select(`
          *,
          players:convocation_players!convocation_players_convocation_id_fkey(player_id, selected)
        `)
        .eq('match_id', matchId)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const conv = data[0];
        this.currentConvocationId = conv.id;
        document.getElementById('conv-meeting').value = conv.meeting_time || '';
        document.getElementById('conv-kit').value = conv.kit_info || 'Maglia granata, pantaloncini neri, calzettoni granata';
        document.getElementById('conv-bring').value = conv.what_to_bring || '';
        document.getElementById('conv-notes').value = conv.notes || '';
        
        conv.players?.filter(p => p.selected).forEach(p => this.selectedPlayers.add(p.player_id));
        document.querySelectorAll('.player-cb').forEach(cb => {
          cb.checked = this.selectedPlayers.has(cb.value);
        });
        
        toast('Bozza precedente caricata', 'success');
      }
    } catch (err) {
      console.error('Errore caricamento bozza:', err);
    }
    this.updatePreview();
  },

  toggleAllPlayers(selectAll) {
    document.querySelectorAll('.player-cb').forEach(cb => {
      cb.checked = selectAll;
      if (selectAll) this.selectedPlayers.add(cb.value);
      else this.selectedPlayers.delete(cb.value);
    });
    this.updatePreview();
  },

  updatePreview() {
    const matchId = document.getElementById('conv-match').value;
    const date = document.getElementById('conv-date').value;
    const location = document.getElementById('conv-location').value;
    const meeting = document.getElementById('conv-meeting').value;
    const kickoff = document.getElementById('conv-kickoff').value;
    const kit = document.getElementById('conv-kit').value;
    const bring = document.getElementById('conv-bring').value;
    const notes = document.getElementById('conv-notes').value;

    const matchOption = document.getElementById('conv-match').selectedOptions[0];
    const matchText = matchId ? matchOption.textContent : '[Partita non selezionata]';
    
    const selectedNames = Array.from(document.querySelectorAll('.player-cb:checked'))
      .map(cb => cb.parentElement.querySelector('span').textContent)
      .join(', ');

    const msg = `🏟️ *CONVOCAZIONE - ASD San Carlo Milano U9*

⚽ *Partita:* ${matchText}
📅 *Data:* ${date ? new Date(date).toLocaleDateString('it-IT') : '[Da definire]'}
⏰ *Ritrovo:* ${meeting || '[--:--]'} | *Inizio:* ${kickoff || '[--:--]'}
📍 *Luogo:* ${location || '[Da definire]'}

 *Divisa:* ${kit}
🎒 *Da portare:* ${bring || '[Nessuna indicazione]'}

👇 *CONVOCATI:*
${selectedNames || 'Nessun giocatore selezionato'}

${notes ? `📝 *Note:* ${notes}\n` : ''}
✅ *Si prega di confermare la presenza al più presto.*
Grazie e buon calcio! 🤝⚽`;

    document.getElementById('msg-preview').value = msg;
  },

  async saveConvocation() {
    const matchId = document.getElementById('conv-match').value;
    if (!matchId) return toast('Seleziona una partita', 'error');
    
    const payload = {
      match_id: matchId,
      meeting_time: document.getElementById('conv-meeting').value,
      kit_info: document.getElementById('conv-kit').value,
      what_to_bring: document.getElementById('conv-bring').value,
      notes: document.getElementById('conv-notes').value
    };

    try {
      if (this.currentConvocationId) {
        const { error } = await db.from('convocations').update(payload).eq('id', this.currentConvocationId);
        if (error) throw error;
        
        await db.from('convocation_players').delete().eq('convocation_id', this.currentConvocationId);
        const playerRows = Array.from(this.selectedPlayers).map(pid => ({
          convocation_id: this.currentConvocationId,
          player_id: pid,
          selected: true
        }));
        if (playerRows.length > 0) {
          const { error: pErr } = await db.from('convocation_players').insert(playerRows);
          if (pErr) throw pErr;
        }
      } else {
        const { data, error } = await db.from('convocations').insert(payload).select().single();
        if (error) throw error;
        this.currentConvocationId = data.id;
        
        const playerRows = Array.from(this.selectedPlayers).map(pid => ({
          convocation_id: data.id,
          player_id: pid,
          selected: true
        }));
        if (playerRows.length > 0) {
          const { error: pErr } = await db.from('convocation_players').insert(playerRows);
          if (pErr) throw pErr;
        }
      }
      toast('Convocazione salvata! ✅', 'success');
    } catch (err) {
      toast('Errore salvataggio: ' + err.message, 'error');
    }
  },

  copyMessage() {
    const msg = document.getElementById('msg-preview').value;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => toast('Messaggio copiato! 📋', 'success'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Messaggio copiato! 📋', 'success');
    }
  },

  // ===== FUNZIONE CHIAVE: Apre SOLO WhatsApp normale =====
  openWhatsApp() {
    const msg = document.getElementById('msg-preview').value;
    const encodedMsg = encodeURIComponent(msg);
    
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    
    try {
      if (isAndroid) {
        // Intent Android ESPlicito: forza WhatsApp normale (package: com.whatsapp)
        // WhatsApp Business ha package: com.whatsapp.w4b
        const intentUrl = `intent://send?text=${encodedMsg}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
        
        // Prova ad aprire WhatsApp normale
        window.location.href = intentUrl;
        
        // Fallback dopo 1.5 secondi se non si apre
        setTimeout(() => {
          // Se siamo ancora qui, WhatsApp non è installato
          if (confirm('WhatsApp non sembra installato. Aprire WhatsApp Web?')) {
            window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
          }
        }, 1500);
        
      } else if (isIOS) {
        // Su iOS non c'è distinzione tra normale e Business
        // Usa lo scheme whatsapp://
        const waUrl = `whatsapp://send?text=${encodedMsg}`;
        window.location.href = waUrl;
        
        setTimeout(() => {
          if (confirm('WhatsApp non sembra installato. Aprire WhatsApp Web?')) {
            window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
          }
        }, 1500);
        
      } else {
        // Desktop: usa WhatsApp Web
        window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
      }
    } catch (err) {
      console.error('Errore apertura WhatsApp:', err);
      // Fallback universale
      window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
    }
  },

  quickMessages: [
    {
      label: '🏃‍♂️ Promemoria Presenza',
      generator: () => {
        const date = document.getElementById('conv-date').value || '[data allenamento]';
        return `🔔 *PROMEMORIA*\nCiao a tutti! Ricordatevi di confermare la presenza per l'allenamento/partita del ${date}. Grazie! ⚽`;
      }
    },
    {
      label: '⚽ Ricordo Partita',
      generator: () => {
        const match = document.getElementById('conv-match').selectedOptions[0]?.textContent || '[partita]';
        const time = document.getElementById('conv-meeting').value || '[ora]';
        return `⚽ *RICORDO PARTITA*\nVi aspetto per ${match}!\n⏰ Ritrovo: ${time}\nPortate tutto il materiale e tanta grinta! 💪🤝`;
      }
    },
    {
      label: '📢 Cambio Orario/Luogo',
      generator: () => {
        return `📢 *AGGIORNAMENTO IMPORTANTE*\nL'allenamento/partita subisce una variazione.\n📍 Nuovo luogo: [Da comunicare]\n⏰ Nuovo orario: [Da comunicare]\nVi preghiamo di confermare la ricezione. Grazie! 🙏`;
      }
    },
    {
      label: '🩺 Scadenza Certificati',
      generator: () => {
        return ` *SCADENZA CERTIFICATI MEDICI*\nAi genitori ricordiamo di controllare la scadenza del certificato medico e di consegnare il rinnovo prima della data indicata. È obbligatorio per partecipare agli allenamenti e alle partite. Grazie per la collaborazione! 📋✅`;
      }
    }
  ],

  renderQuickMessages() {
    const container = document.getElementById('quick-msgs-list');
    container.innerHTML = this.quickMessages.map((qm, i) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
        <span style="font-size: 14px; font-weight: 500;">${qm.label}</span>
        <button class="btn btn-ghost" data-idx="${i}" style="font-size: 12px; padding: 4px 10px;">📋 Copia</button>
      </div>
    `).join('');

    container.querySelectorAll('button[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = this.quickMessages[parseInt(btn.dataset.idx)].generator();
        navigator.clipboard?.writeText(msg).then(() => toast('Messaggio copiato! 📋', 'success'));
      });
    });
  }
};

window.WhatsAppPage = WhatsAppPage;