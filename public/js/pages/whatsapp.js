const WhatsAppPage = {
  selectedPlayers: new Set(),
  selectedEquipment: new Set(),
  currentConvocationId: null,
  sanCarloId: null,
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',
  locationMap: null,
  locationMarker: null,
  EQUIPMENT_LIST: [
    { id: 'borraccia', label: 'Borraccia', emoji: '💧' },
    { id: 'pantaloncini', label: 'Pantaloncini ERREA', emoji: '🩳' },
    { id: 'parastinchi', label: 'Parastinchi', emoji: '️🛡️' },
    { id: 'scarpe', label: 'Scarpe da calcio', emoji: '👟' },
    { id: 'maglia', label: 'Maglia con numero', emoji: '👕' },
    { id: 'calzettoni', label: 'Calzettoni', emoji: '🧦' },
    { id: 'tuta', label: 'Tuta di rappresentanza', emoji: '🏃‍♂️' },
    { id: 'giaccone', label: 'Giaccone', emoji: '🧥' },
    { id: 'kway', label: 'Kway', emoji: '🌧️' }
  ],

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📱 WhatsApp Convocazioni</h2>
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
          <div id="location-map-container" style="display: none; margin-top: 8px;">
            <div id="location-map" style="height: 180px; border-radius: 8px; overflow: hidden; border: 1px solid var(--gray-200);"></div>
            <button type="button" id="btn-open-maps" style="margin-top: 8px; width: 100%; padding: 8px; background: var(--granata); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
              📍 Apri nel navigatore
            </button>
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
            <label>🧦 Divisa / Kit</label>
            <input type="text" id="conv-kit" class="form-control" value="Maglia granata, pantaloncini neri, calzettoni granata" />
          </div>
          <div class="form-group">
            <label>🎒 Cosa Portare</label>
            <div class="role-tabs" style="margin-bottom: 8px;">
              <button type="button" id="btn-equip-all" class="role-tab" style="padding: 6px; font-size: 12px;">✅ Tutti</button>
              <button type="button" id="btn-equip-none" class="role-tab" style="padding: 6px; font-size: 12px;">❌ Nessuno</button>
            </div>
            <div id="conv-equip-list" style="max-height: 220px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 8px; background: var(--gray-50);">
            </div>
          </div>
          <div class="form-group">
            <label>📝 Note (opzionale)</label>
            <textarea id="conv-notes" class="form-control" rows="2" placeholder="Es: Portare certificato medico"></textarea>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="flex-between mb-4">
          <div class="card-title" style="margin-bottom: 0;">👇 Convocati</div>
          <div style="display: flex; gap: 6px;">
            <button id="btn-select-all" class="btn btn-ghost" style="font-size: 12px; padding: 4px 8px;">✅ Tutti</button>
            <button id="btn-deselect-all" class="btn btn-ghost" style="font-size: 12px; padding: 4px 8px;">❌ Nessuno</button>
          </div>
        </div>
        <div id="conv-players-list" style="max-height: 250px; overflow-y: auto;">
          <div class="spinner"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title"> Anteprima Messaggio</div>
        <textarea id="msg-preview" class="form-control" rows="12" readonly style="font-family: monospace; font-size: 13px; background: var(--gray-50);"></textarea>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
          <button id="btn-save-conv" class="btn btn-secondary">💾 Salva Bozza</button>
          <button id="btn-copy-msg" class="btn btn-secondary">📋 Copia</button>
        </div>
        <button id="btn-open-wa" class="btn btn-primary btn-block" style="margin-top: 8px;">📲 Apri WhatsApp</button>
        <small style="display: block; text-align: center; margin-top: 6px; color: var(--gray-500); font-size: 11px;">
          ℹ️ Apre sempre WhatsApp normale (non Business)
        </small>
      </div>
      <div class="card">
        <div class="card-title">⚡ Messaggi Rapidi</div>
        <div id="quick-msgs-list"></div>
      </div>
    `;

    document.getElementById('conv-match').addEventListener('change', (e) => this.onMatchSelected(e.target.value));
    document.getElementById('conv-date').addEventListener('input', () => this.updatePreview());

    let locationTimeout;
    document.getElementById('conv-location').addEventListener('input', (e) => {
      clearTimeout(locationTimeout);
      const location = e.target.value.trim();
      if (location.length < 3) {
        document.getElementById('location-map-container').style.display = 'none';
        return;
      }
      locationTimeout = setTimeout(() => this.initLocationMap(location), 800);
      this.updatePreview();
    });

    document.getElementById('btn-open-maps').addEventListener('click', () => {
      const location = document.getElementById('conv-location').value;
      if (location) this.openInMaps(location);
    });

    document.getElementById('conv-meeting').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-kickoff').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-kit').addEventListener('input', () => this.updatePreview());
    document.getElementById('conv-notes').addEventListener('input', () => this.updatePreview());

    document.getElementById('btn-equip-all').addEventListener('click', () => this.toggleAllEquipment(true));
    document.getElementById('btn-equip-none').addEventListener('click', () => this.toggleAllEquipment(false));
    document.getElementById('btn-select-all').addEventListener('click', () => this.toggleAllPlayers(true));
    document.getElementById('btn-deselect-all').addEventListener('click', () => this.toggleAllPlayers(false));
    document.getElementById('btn-save-conv').addEventListener('click', () => this.saveConvocation());
    document.getElementById('btn-copy-msg').addEventListener('click', () => this.copyMessage());
    document.getElementById('btn-open-wa').addEventListener('click', () => this.openWhatsApp());

    await this.loadSanCarloId();
    await this.loadMatches();
    await this.loadPlayers();
    this.renderEquipmentList();
    this.renderQuickMessages();
    this.updatePreview();
  },

  async geocodeLocation(address) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'Accept-Language': 'it' } }
      );
      const data = await response.json();
      return data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('❌ Errore geocodifica:', err);
      return null;
    }
  },

  async initLocationMap(location) {
    const container = document.getElementById('location-map-container');
    const mapDiv = document.getElementById('location-map');

    const coords = await this.geocodeLocation(location);
    if (!coords) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    if (this.locationMap) {
      this.locationMap.remove();
    }

    const lat = parseFloat(coords.lat);
    const lon = parseFloat(coords.lon);

    this.locationMap = L.map('location-map', {
      attributionControl: false,
      zoomControl: false
    }).setView([lat, lon], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.locationMap);

    L.control.zoom({ position: 'topright' }).addTo(this.locationMap);

    this.locationMarker = L.marker([lat, lon]).addTo(this.locationMap)
      .bindPopup(location)
      .openPopup();

    setTimeout(() => this.locationMap.invalidateSize(), 100);
  },

  async openInMaps(location) {
    const coords = await this.geocodeLocation(location);
    if (!coords) {
      alert('Impossibile trovare la posizione: ' + location);
      return;
    }

    const lat = coords.lat;
    const lon = coords.lon;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isAndroid = /android/i.test(navigator.userAgent);

    if (isIOS) {
      this.showMapsChoiceDialog(location, lat, lon);
    } else if (isAndroid) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/place/?q=${lat},${lon}`, '_blank');
    }
  },

  showMapsChoiceDialog(location, lat, lon) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;`;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 320px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    dialog.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 16px; font-weight: 700; color: var(--granata); margin-bottom: 4px;">📍 Apri con</div>
        <div style="font-size: 13px; color: var(--gray-700);">${location}</div>
      </div>
      <button id="btn-apple-maps" style="
        width: 100%;
        padding: 12px;
        margin-bottom: 8px;
        background: #007AFF;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">🍎 Apple Maps</button>
      <button id="btn-google-maps" style="
        width: 100%;
        padding: 12px;
        margin-bottom: 8px;
        background: #4285F4;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">🗺️ Google Maps</button>
      <button id="btn-cancel-maps" style="
        width: 100%;
        padding: 12px;
        background: var(--gray-200);
        color: var(--gray-700);
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">Annulla</button>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.getElementById('btn-apple-maps').addEventListener('click', () => {
      window.open(`http://maps.apple.com/?ll=${lat},${lon}&q=${encodeURIComponent(location)}`, '_blank');
      document.body.removeChild(overlay);
    });

    document.getElementById('btn-google-maps').addEventListener('click', () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
      document.body.removeChild(overlay);
    });

    document.getElementById('btn-cancel-maps').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  },

  async loadSanCarloId() {
    try {
      const { data, error } = await db
        .from('teams')
        .select('id')
        .eq('name', this.SANCARLO_TEAM_NAME)
        .single();
      if (error) throw error;
      this.sanCarloId = data?.id || null;
    } catch (err) {
      console.error('❌ Errore caricamento ID S. Carlo:', err);
      this.sanCarloId = null;
    }
  },

  // ===== CARICA TUTTE LE PARTITE FUTURE SENZA CONVOCAZIONE =====
  async loadMatches() {
    const select = document.getElementById('conv-match');
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 Cercando tutte le partite future dal', today);

      // 1. Carica tutte le partite future di S. Carlo
      let query = db
        .from('matches')
        .select(`id, matchday, match_type, match_date, match_time, location, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true });

      if (this.sanCarloId) {
        query = query.or(`home_team_id.eq.${this.sanCarloId},away_team_id.eq.${this.sanCarloId}`);
      }

      const { data: allMatches, error } = await query;
      if (error) throw error;

      console.log('✅ Partite future trovate:', allMatches?.length || 0);

      // 2. Carica tutte le convocazioni già salvate
      const { data: existingConvocations, error: convErr } = await db
        .from('convocations')
        .select('match_id');

      if (convErr) console.error('❌ Errore caricamento convocazioni:', convErr);

      const matchesWithConvocation = new Set(existingConvocations?.map(c => c.match_id) || []);
      console.log('🚫 Partite già convocate:', matchesWithConvocation.size);

      // 3. Filtra solo le partite SENZA convocazione
      const availableMatches = allMatches.filter(m => !matchesWithConvocation.has(m.id));
      console.log('✅ Partite disponibili per convocazione:', availableMatches.length);

      // 4. Popola il dropdown
      let html = '<option value="">-- Seleziona partita --</option>';
      if (availableMatches && availableMatches.length > 0) {
        availableMatches.forEach(m => {
          const date = new Date(m.match_date).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
          const typeLabel = m.match_type === 'andata' ? '🏁' : '🔄';
          const homeName = m.home_team?.name || '?';
          const awayName = m.away_team?.name || '?';
          const timeStr = m.match_time ? ` · ⏰ ${m.match_time}` : '';
          html += `<option value="${m.id}" data-date="${m.match_date}" data-time="${m.match_time || ''}" data-location="${m.location || ''}" data-home="${homeName}" data-away="${awayName}">${typeLabel} G${m.matchday} · ${homeName} vs ${awayName} (${date}${timeStr})</option>`;
        });
      } else {
        html = '<option value="">-- Nessuna partita disponibile --</option>';
      }
      select.innerHTML = html;
    } catch (err) {
      toast('Errore caricamento partite: ' + err.message, 'error');
      console.error('❌ Errore loadMatches:', err);
    }
  },

  async onMatchSelected(matchId) {
    document.getElementById('conv-date').value = '';
    document.getElementById('conv-location').value = '';
    document.getElementById('conv-meeting').value = '';
    document.getElementById('conv-kickoff').value = '';
    document.getElementById('location-map-container').style.display = 'none';
    this.currentConvocationId = null;

    if (!matchId) {
      this.updatePreview();
      return;
    }

    const select = document.getElementById('conv-match');
    const option = select.selectedOptions[0];
    if (!option) return;

    const matchDate = option.dataset.date;
    const matchTime = option.dataset.time;
    const matchLocation = option.dataset.location;

    if (matchDate) document.getElementById('conv-date').value = matchDate;
    if (matchLocation) {
      document.getElementById('conv-location').value = matchLocation;
      this.initLocationMap(matchLocation);
    }
    if (matchTime) {
      document.getElementById('conv-kickoff').value = matchTime;
      const meetingTime = this.subtractMinutes(matchTime, 30);
      document.getElementById('conv-meeting').value = meetingTime;
    }

    await this.loadExistingConvocation(matchId);
    this.updatePreview();
  },

  subtractMinutes(timeStr, minutes) {
    if (!timeStr) return '';
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins - minutes, 0, 0);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  },

  renderEquipmentList() {
    const container = document.getElementById('conv-equip-list');
    container.innerHTML = this.EQUIPMENT_LIST.map(item => `
      <label style="display: flex; align-items: center; gap: 10px; padding: 8px 4px; border-bottom: 1px solid var(--gray-200); cursor: pointer;">
        <input type="checkbox" class="equip-cb" value="${item.id}" style="width: 18px; height: 18px; accent-color: var(--granata);" />
        <span style="font-size: 16px;">${item.emoji}</span>
        <span style="flex: 1; font-weight: 500; font-size: 14px;">${item.label}</span>
      </label>
    `).join('');
    container.querySelectorAll('.equip-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) this.selectedEquipment.add(cb.value);
        else this.selectedEquipment.delete(cb.value);
        this.updatePreview();
      });
    });
  },

  toggleAllEquipment(selectAll) {
    document.querySelectorAll('.equip-cb').forEach(cb => {
      cb.checked = selectAll;
      if (selectAll) this.selectedEquipment.add(cb.value);
      else this.selectedEquipment.delete(cb.value);
    });
    this.updatePreview();
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
      container.innerHTML = data?.map(p => `
        <label style="display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-bottom: 1px solid var(--gray-200); cursor: pointer;">
          <input type="checkbox" class="player-cb" value="${p.id}" style="width: 18px; height: 18px; accent-color: var(--granata);" />
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
    try {
      const { data, error } = await db
        .from('convocations')
        .select(`*, players:convocation_players!convocation_players_convocation_id_fkey(player_id, selected)`)
        .eq('match_id', matchId)
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const conv = data[0];
        this.currentConvocationId = conv.id;
        if (conv.meeting_time) document.getElementById('conv-meeting').value = conv.meeting_time;
        if (conv.kit_info) document.getElementById('conv-kit').value = conv.kit_info;
        if (conv.notes) document.getElementById('conv-notes').value = conv.notes;
        if (conv.what_to_bring) {
          const savedEquip = conv.what_to_bring.split(',').filter(id => id.trim());
          this.selectedEquipment.clear();
          savedEquip.forEach(id => this.selectedEquipment.add(id));
          document.querySelectorAll('.equip-cb').forEach(cb => {
            cb.checked = this.selectedEquipment.has(cb.value);
          });
        }
        this.selectedPlayers.clear();
        conv.players?.filter(p => p.selected).forEach(p => this.selectedPlayers.add(p.player_id));
        document.querySelectorAll('.player-cb').forEach(cb => {
          cb.checked = this.selectedPlayers.has(cb.value);
        });
        toast('Bozza precedente caricata', 'success');
      }
    } catch (err) {
      console.error('❌ Errore caricamento bozza:', err);
    }
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
    const notes = document.getElementById('conv-notes').value;
    const matchOption = document.getElementById('conv-match').selectedOptions[0];

    const cleanTime = (time) => {
      if (!time) return '[--:--]';
      return time.split(':').slice(0, 2).join(':');
    };

    const homeName = matchOption?.dataset.home || 'Casa';
    const awayName = matchOption?.dataset.away || 'Ospite';
    const matchText = matchId ? `${homeName} vs ${awayName}` : '[Partita non selezionata]';
    const dateStr = date ? new Date(date).toLocaleDateString('it-IT') : '[Da definire]';

    const selectedNames = Array.from(document.querySelectorAll('.player-cb:checked'))
      .map(cb => cb.parentElement.querySelector('span:nth-child(2)').textContent)
      .join('\n');

    const selectedEquip = Array.from(document.querySelectorAll('.equip-cb:checked'))
      .map(cb => {
        const item = this.EQUIPMENT_LIST.find(e => e.id === cb.value);
        return item ? `${item.emoji} ${item.label}` : cb.value;
      })
      .join('\n');

    // ✅ Link Google Maps universale
    const mapsLink = location
      ? `\n🗺️ Mappa: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : '';

    const msg = `🏟️ CONVOCAZIONE - ASD San Carlo Milano U9
	
⚽ Partita: ${matchText}
📅 Data: ${dateStr}  Inizio: ${cleanTime(kickoff)}
⏰ Ritrovo PUNTUALI: ${cleanTime(meeting)}
📍 Luogo: ${location || '[Da definire]'}${mapsLink}
🧦 Divisa: ${kit}

👇 CONVOCATI:
${selectedNames || '[Nessun giocatore selezionato]'}

🎒 Da portare:
${selectedEquip || '[Nessun articolo selezionato]'}

${notes ? `\n📝 *Note:* ${notes}\n` : ''}💚 In caso di assenza, contattare il mister con anticipo!
Forza Ragazzi!!! 💪⚽`;

    document.getElementById('msg-preview').value = msg;
  },

  async saveConvocation() {
    const matchId = document.getElementById('conv-match').value;
    if (!matchId) return toast('Seleziona una partita', 'error');

    const whatToBring = Array.from(this.selectedEquipment).join(',');
    const payload = {
      match_id: matchId,
      meeting_time: document.getElementById('conv-meeting').value,
      kit_info: document.getElementById('conv-kit').value,
      what_to_bring: whatToBring,
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
      if (this.selectedPlayers.size > 0) {
        this.sendConvocationNotification(Array.from(this.selectedPlayers));
      }
    } catch (err) {
      toast('Errore salvataggio: ' + err.message, 'error');
    }
  },

  async sendConvocationNotification(playerIds) {
    try {
      console.log('📤 Invio notifica convocazione ai player:', playerIds);
      const { data: playersData, error } = await db
        .from('players')
        .select('id, parent_id, parent_id_2, first_name, last_name')
        .in('id', playerIds);
      if (error) {
        console.error('❌ Errore recupero player:', error);
        return;
      }
      const parentIds = new Set();
      playersData.forEach(p => {
        if (p.parent_id) parentIds.add(p.parent_id);
        if (p.parent_id_2) parentIds.add(p.parent_id_2);
      });
      const userIds = Array.from(parentIds);
      if (userIds.length === 0) {
        console.warn('⚠️ Nessun parent_id trovato per i player selezionati');
        return;
      }
      console.log(' Invio notifica a user_id:', userIds);
      const matchOption = document.getElementById('conv-match').selectedOptions[0];
      const matchText = matchOption ? matchOption.textContent.split('·')[1]?.trim() || 'prossima partita' : 'prossima partita';
      const meeting = document.getElementById('conv-meeting').value;
      const title = '📋 Nuova Convocazione';
      const message = `Sei stato convocato per ${matchText}\n⏰ Ritrovo: ${meeting || '--:--'}\nControlla i dettagli nell'app!`;
      const success = await PushManager.sendNotification(title, message, { userIds });
      if (success) {
        console.log('✅ Notifica push inviata a', userIds.length, 'genitori');
      }
    } catch (err) {
      console.error('❌ Errore invio notifica convocazione:', err);
    }
  },

  copyMessage() {
    const msg = document.getElementById('msg-preview').value;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => toast('Messaggio copiato! ', 'success'));
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

  openWhatsApp() {
    const msg = document.getElementById('msg-preview').value;
    this.openWhatsAppWithMessage(msg);
  },

  openWhatsAppWithMessage(msg) {
    const encodedMsg = encodeURIComponent(msg);
    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    try {
      if (isAndroid) {
        const intentUrl = `intent://send?text=${encodedMsg}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
        window.location.href = intentUrl;
        setTimeout(() => {
          if (confirm('WhatsApp non sembra installato. Aprire WhatsApp Web?')) {
            window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
          }
        }, 1500);
      } else if (isIOS) {
        const waUrl = `whatsapp://send?text=${encodedMsg}`;
        window.location.href = waUrl;
        setTimeout(() => {
          if (confirm('WhatsApp non sembra installato. Aprire WhatsApp Web?')) {
            window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
          }
        }, 1500);
      } else {
        window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
      }
    } catch (err) {
      console.error('❌ Errore apertura WhatsApp:', err);
      window.open(`https://web.whatsapp.com/send?text=${encodedMsg}`, '_blank');
    }
  },

  quickMessages: [
    {
      label: '🏃‍️ Promemoria Allenamento',
      generator: () => {
        const date = document.getElementById('conv-date').value || '[data allenamento]';
        return `🔔 *PROMEMORIA ALLENAMENTO*\n\nCiao a tutti! Ricordatevi di confermare la presenza per l'allenamento del ${date ? new Date(date).toLocaleDateString('it-IT') : '[data da definire]'}. \n\n Conferma qui: https://under9.asdsancarlomilano.it\n\nGrazie! ⚽`;
      }
    },
    {
      label: '⚽ Ricordo Partita',
      generator: () => {
        const match = document.getElementById('conv-match').selectedOptions[0]?.textContent || '[partita]';
        const time = document.getElementById('conv-meeting').value || '[ora]';
        return `⚽ *RICORDO PARTITA*\n\nVi aspetto per ${match}!\n⏰ Ritrovo: ${time}\n\nPortate tutto il materiale e tanta grinta! 💪`;
      }
    },
    {
      label: '📢 Cambio Orario/Luogo',
      generator: () => {
        return `📢 *AGGIORNAMENTO IMPORTANTE*\n\nL'allenamento/partita subisce una variazione.\n📍 Nuovo luogo: [Da comunicare]\n⏰ Nuovo orario: [Da comunicare]\n\nVi preghiamo di confermare la ricezione. Grazie! 🙏`;
      }
    },
    {
      label: '🩺 Scadenza Certificati',
      generator: () => {
        return `🩺 *SCADENZA CERTIFICATI MEDICI*\n\nAi genitori ricordiamo di controllare la scadenza del certificato medico e di consegnare il rinnovo prima della data indicata. È obbligatorio per partecipare agli allenamenti e alle partite.\n\nGrazie per la collaborazione! ✅`;
      }
    }
  ],

  renderQuickMessages() {
    const container = document.getElementById('quick-msgs-list');
    container.innerHTML = this.quickMessages.map((qm, i) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--gray-200); gap: 8px;">
        <span style="font-size: 14px; font-weight: 500; flex: 1; min-width: 0;">${qm.label}</span>
        <div style="display: flex; gap: 6px; flex-shrink: 0;">
          <button class="btn btn-secondary" data-copy-idx="${i}" style="font-size: 12px; padding: 6px 12px; min-height: 32px;">📋 Copia</button>
          <button class="btn btn-primary" data-wa-idx="${i}" style="font-size: 12px; padding: 6px 12px; min-height: 32px;">📲 WhatsApp</button>
        </div>
      </div>
    `).join('');
    container.querySelectorAll('button[data-copy-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = this.quickMessages[parseInt(btn.dataset.copyIdx)].generator();
        navigator.clipboard?.writeText(msg).then(() => toast('Messaggio copiato! 📋', 'success'));
      });
    });
    container.querySelectorAll('button[data-wa-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const msg = this.quickMessages[parseInt(btn.dataset.waIdx)].generator();
        this.openWhatsAppWithMessage(msg);
      });
    });
  }
};

window.WhatsAppPage = WhatsAppPage;