const HomePage = {
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',
  matchMap: null,

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

  // ===== GEOCODIFICA CON NOMINATIM (OpenStreetMap - GRATIS) =====
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

  // ===== INIZIALIZZA MAPPA PROSSIMA PARTITA =====
  async initMatchMap(location) {
    const mapDiv = document.getElementById('match-map');
    if (!mapDiv) return;

    const coords = await this.geocodeLocation(location);
    if (!coords) {
      mapDiv.style.display = 'none';
      return;
    }

    mapDiv.style.display = 'block';
    const lat = parseFloat(coords.lat);
    const lon = parseFloat(coords.lon);

    if (this.matchMap) {
      this.matchMap.remove();
    }

    this.matchMap = L.map('match-map', {
      attributionControl: false,
      zoomControl: false
    }).setView([lat, lon], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(this.matchMap);

    L.control.zoom({ position: 'topright' }).addTo(this.matchMap);

    L.marker([lat, lon]).addTo(this.matchMap)
      .bindPopup(location)
      .openPopup();

    setTimeout(() => this.matchMap.invalidateSize(), 100);
  },

  // ===== APRI MAPPE CON SCELTA SU iOS =====
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

  // ===== DIALOG SCELTA MAPPE SU iOS =====
  showMapsChoiceDialog(location, lat, lon) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

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
      ">️ Google Maps</button>
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
               ${formatTime(t.time)} ${t.location ? '· 📍 ' + t.location : ''}
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

      const { profile } = await Auth.getCurrentUser();
      let convocationBanner = '';
      if (profile?.role === 'mister') {
        convocationBanner = `
          <div style="margin-top: 12px; padding: 10px 12px; background: rgba(122,31,46,0.08); border-left: 3px solid var(--granata); border-radius: 8px; font-size: 13px;">
            <div style="font-weight: 600; color: var(--granata); margin-bottom: 2px;">👨‍🏫 Sei il Mister</div>
            <div style="color: var(--gray-700); font-size: 12px;">Gestisci la convocazione dalla sezione WhatsApp 📱</div>
          </div>
        `;
      } else {
        convocationBanner = await this.buildConvocationBanner(m.id, profile);
      }

      // ✅ Mappa e pulsante solo se c'è un luogo
      const mapSection = m.location ? `
        <div id="match-map" style="height: 180px; margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1px solid var(--gray-200); display: none;"></div>
        <button id="btn-open-maps" type="button" style="margin-top: 8px; width: 100%; padding: 8px; background: var(--granata); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
          📍 Apri nel navigatore
        </button>
      ` : '';

      container.innerHTML = `
        <div class="card-title">⚽ Prossima Partita</div>
        <div style="text-align: center;">
          <div style="font-size: 13px; color: var(--gray-500); margin-bottom: 8px;">
            ${m.match_type === 'andata' ? ' Andata' : '🔄 Ritorno'} · Giornata ${m.matchday || '?'}
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
        ${mapSection}
        ${convocationBanner}
      `;

      // ✅ Inizializza mappa e pulsante dopo il render
      if (m.location) {
        await this.initMatchMap(m.location);
        document.getElementById('btn-open-maps')?.addEventListener('click', () => {
          this.openInMaps(m.location);
        });
      }
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async buildConvocationBanner(matchId, profile) {
    try {
      if (!profile?.id) return '';
      const { data: player, error: pErr } = await db
        .from('players')
        .select('id, first_name, last_name')
        .or(`parent_id.eq.${profile.id},parent_id_2.eq.${profile.id}`)
        .limit(1)
        .single();
      if (pErr || !player) {
        return `
          <div style="margin-top: 12px; padding: 10px 12px; background: rgba(107,114,128,0.08); border-left: 3px solid var(--gray-500); border-radius: 8px; font-size: 13px;">
            <div style="color: var(--gray-700); font-size: 12px;">⚠️ Nessun figlio associato al tuo account</div>
          </div>
        `;
      }
      const { data: convocation, error: cErr } = await db
        .from('convocations')
        .select('id, meeting_time, kit_info, what_to_bring, notes')
        .eq('match_id', matchId)
        .limit(1)
        .single();
      if (cErr || !convocation) {
        return `
          <div style="margin-top: 12px; padding: 10px 12px; background: rgba(245,158,11,0.1); border-left: 3px solid var(--warning); border-radius: 8px; font-size: 13px;">
            <div style="font-weight: 600; color: var(--warning); margin-bottom: 2px;">⏳ Convocazione non ancora pubblicata</div>
            <div style="color: var(--gray-700); font-size: 12px;">Il mister pubblicherà a breve i dettagli</div>
          </div>
        `;
      }
      const { data: convPlayer, error: cpErr } = await db
        .from('convocation_players')
        .select('selected')
        .eq('convocation_id', convocation.id)
        .eq('player_id', player.id)
        .single();
      if (cpErr || !convPlayer || !convPlayer.selected) {
        return `
          <div style="margin-top: 12px; padding: 10px 12px; background: rgba(107,114,128,0.1); border-left: 3px solid var(--gray-500); border-radius: 8px; font-size: 13px;">
            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 2px;">❌ ${player.first_name} non è stato convocato</div>
            <div style="color: var(--gray-500); font-size: 12px;">per questa partita</div>
          </div>
        `;
      }
      const meeting = convocation.meeting_time ? formatTime(convocation.meeting_time) : '--:--';
      const kit = convocation.kit_info || 'Da definire';
      let whatToBringText = '';
      if (convocation.what_to_bring) {
        const equipMap = {
          'borraccia': '💧 Borraccia',
          'pantaloncini': '🩳 Pantaloncini',
          'parastinchi': '🛡️ Parastinchi',
          'scarpe': '👟 Scarpe',
          'maglia': '👕 Maglia',
          'calzettoni': '🧦 Calzettoni',
          'tuta': '🏃 Tuta',
          'giaccone': ' Giaccone',
          'kway': '️ Kway'
        };
        const items = convocation.what_to_bring.split(',').map(id => equipMap[id.trim()] || id.trim());
        whatToBringText = items.join(' · ');
      }
      return `
        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(34,197,94,0.1); border-left: 3px solid #22c55e; border-radius: 8px; font-size: 13px;">
          <div style="font-weight: 700; color: #16a34a; margin-bottom: 6px; font-size: 14px;">✅ ${player.first_name} è CONVOCATO!</div>
          <div style="color: var(--gray-700); font-size: 12px; line-height: 1.6;">
            <div>⏰ Ritrovo: <strong>${meeting}</strong></div>
            <div>🧦 Divisa: ${kit}</div>
            ${whatToBringText ? `<div> Portare: ${whatToBringText}</div>` : ''}
            ${convocation.notes ? `<div style="margin-top: 4px; font-style: italic;">📝 ${convocation.notes}</div>` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      console.error('❌ Errore banner convocazione:', err);
      return '';
    }
  },

async loadLastResults() {
  const container = document.getElementById('widget-last-results');
  try {
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
    
    // ✅ Query corretta: prende SOLO l'ultimo risultato della nostra squadra
    const { data, error } = await db
      .from('matches')
      .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
      .lte('match_date', today)
      .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`)
      .order('match_date', { ascending: false })
      .limit(1); // ✅ Solo l'ultimo inserito

    if (error) {
      console.error('❌ Errore DB risultati:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="card-title">🏆 Ultimi Risultati</div>
        <p style="color: var(--gray-500); text-align: center; padding: 12px;">
          Nessun risultato disponibile
        </p>
      `;
      return;
    }
    
    const m = data[0];
    const homeName = m.home_team?.name || 'Casa';
    const awayName = m.away_team?.name || 'Ospite';
    const score = `${m.home_won_periods ?? '-'} - ${m.away_won_periods ?? '-'}`;
    const dateStr = new Date(m.match_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    
    container.innerHTML = `
      <div class="card-title">🏆 Ultimi Risultati</div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
        <div style="flex: 1;">
          <div style="font-size: 11px; color: var(--gray-500);">
            ${dateStr} · G${m.matchday || '?'}
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
  } catch (err) {
    console.error('❌ Errore loadLastResults:', err);
    container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
  }
}
};

window.HomePage = HomePage;