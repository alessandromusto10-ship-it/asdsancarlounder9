const HomePage = {
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',

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
              ⏰ ${formatTime(t.time)} ${t.location ? '· 📍 ' + t.location : ''}
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
    // Trova l'ID della squadra S. Carlo Milano
    const { data: teamData, error: tErr } = await db
      .from('teams')
      .select('id')
      .eq('name', this.SANCARLO_TEAM_NAME)
      .single();
    if (tErr || !teamData) {
      container.innerHTML = `
        <div class="card-title">⚽ Prossima Partita</div>
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
        <div class="card-title"> Prossima Partita</div>
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
    
    // ✅ NUOVO: Recupera profilo utente per banner convocazione
    const { profile } = await Auth.getCurrentUser();
    let convocationBanner = '';
    
    if (profile?.role === 'mister') {
      // Banner per il mister
      convocationBanner = `
        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(122,31,46,0.08); border-left: 3px solid var(--granata); border-radius: 8px; font-size: 13px;">
          <div style="font-weight: 600; color: var(--granata); margin-bottom: 2px;">👨‍ Sei il Mister</div>
          <div style="color: var(--gray-700); font-size: 12px;">Gestisci la convocazione dalla sezione WhatsApp 📱</div>
        </div>
      `;
    } else {
      // Banner per i genitori
      convocationBanner = await this.buildConvocationBanner(m.id, profile);
    }
    
    container.innerHTML = `
      <div class="card-title">⚽ Prossima Partita</div>
      <div style="text-align: center;">
        <div style="font-size: 13px; color: var(--gray-500); margin-bottom: 8px;">
          ${m.match_type === 'andata' ? '🏁 Andata' : '🔄 Ritorno'} · Giornata ${m.matchday || '?'}
        </div>
        <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 12px 0;">
          <div style="flex: 1; text-align: right; font-weight: 600;">${homeName}</div>
          <div style="font-size: 20px; color: var(--granata); font-weight: 700;">VS</div>
          <div style="flex: 1; text-align: left; font-weight: 600;">${awayName}</div>
        </div>
        <div style="color: var(--gray-700); font-size: 14px;">
          📅 ${dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}
          ${m.match_time ? ' · ⏰ ' + formatTime(m.match_time) : ''}
        </div>
        ${m.location ? `<div style="color: var(--gray-500); font-size: 13px; margin-top: 4px;">📍 ${m.location}</div>` : ''}
        <div style="margin-top: 8px;">${countdown}</div>
      </div>
      ${convocationBanner}
    `;
  } catch (err) {
    container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
  }
},

// ✅ NUOVA FUNZIONE: Costruisce il banner convocazione per i genitori
async buildConvocationBanner(matchId, profile) {
  try {
    if (!profile?.id) return '';
    
    // 1. Trova il player associato al genitore (parent_id o parent_id_2)
    const { data: player, error: pErr } = await db
      .from('players')
      .select('id, first_name, last_name')
      .or(`parent_id.eq.${profile.id},parent_id_2.eq.${profile.id}`)
      .limit(1)
      .single();
    
    if (pErr || !player) {
      // Genitore senza figlio associato
      return `
        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(107,114,128,0.08); border-left: 3px solid var(--gray-500); border-radius: 8px; font-size: 13px;">
          <div style="color: var(--gray-700); font-size: 12px;">⚠️ Nessun figlio associato al tuo account</div>
        </div>
      `;
    }
    
    // 2. Controlla se esiste una convocazione per questa partita
    const { data: convocation, error: cErr } = await db
      .from('convocations')
      .select('id, meeting_time, kit_info, what_to_bring, notes')
      .eq('match_id', matchId)
      .limit(1)
      .single();
    
    if (cErr || !convocation) {
      // Nessuna convocazione pubblicata
      return `
        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(245,158,11,0.1); border-left: 3px solid var(--warning); border-radius: 8px; font-size: 13px;">
          <div style="font-weight: 600; color: var(--warning); margin-bottom: 2px;">⏳ Convocazione non ancora pubblicata</div>
          <div style="color: var(--gray-700); font-size: 12px;">Il mister pubblicherà a breve i dettagli</div>
        </div>
      `;
    }
    
    // 3. Controlla se il player è tra i convocati
    const { data: convPlayer, error: cpErr } = await db
      .from('convocation_players')
      .select('selected')
      .eq('convocation_id', convocation.id)
      .eq('player_id', player.id)
      .single();
    
    if (cpErr || !convPlayer || !convPlayer.selected) {
      // Player NON convocato
      return `
        <div style="margin-top: 12px; padding: 10px 12px; background: rgba(107,114,128,0.1); border-left: 3px solid var(--gray-500); border-radius: 8px; font-size: 13px;">
          <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 2px;">❌ ${player.first_name} non è stato convocato</div>
          <div style="color: var(--gray-500); font-size: 12px;">per questa partita</div>
        </div>
      `;
    }
    
    // 4. Player CONVOCATO → mostra i dettagli
    const meeting = convocation.meeting_time ? formatTime(convocation.meeting_time) : '--:--';
    const kit = convocation.kit_info || 'Da definire';
    
    // Decodifica what_to_bring (lista di ID separati da virgola)
    let whatToBringText = '';
    if (convocation.what_to_bring) {
      const equipMap = {
        'borraccia': '💧 Borraccia',
        'pantaloncini': '🩳 Pantaloncini',
        'parastinchi': '🛡️ Parastinchi',
        'scarpe': '👟 Scarpe',
        'maglia': '👕 Maglia',
        'calzettoni': '🧦 Calzettoni',
        'tuta': ' 🏃‍♂ Tuta',
        'giaccone': '🧥 Giaccone',
        'kway': '🌧️ Kway'
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
          ${whatToBringText ? `<div>🎒 Portare: ${whatToBringText}</div>` : ''}
          ${convocation.notes ? `<div style="margin-top: 4px; font-style: italic;">📝 ${convocation.notes}</div>` : ''}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Errore banner convocazione:', err);
    return '';
  }
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

      container.innerHTML = `
        <div class="card-title">⚽ Prossima Partita</div>
        <div style="text-align: center;">
          <div style="font-size: 13px; color: var(--gray-500); margin-bottom: 8px;">
            ${m.match_type === 'andata' ? '🏁 Andata' : '🔄 Ritorno'} · Giornata ${m.matchday || '?'}
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
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async loadLastResults() {
    const container = document.getElementById('widget-last-results');
    try {
      // Trova l'ID della squadra S. Carlo Milano
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

      const { data, error } = await db
        .from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .lte('match_date', today)
        .not('home_won_periods', 'is', null)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`)
        .order('match_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <div class="card-title"> Ultimi Risultati</div>
          <p style="color: var(--gray-500); text-align: center; padding: 12px;">
            Nessun risultato disponibile
          </p>
        `;
        return;
      }

      const resultsHtml = data.map(m => {
        const dateObj = new Date(m.match_date);
        const homeName = m.home_team?.name || 'Casa';
        const awayName = m.away_team?.name || 'Ospite';
        const score = `${m.home_won_periods ?? '-'} - ${m.away_won_periods ?? '-'}`;

        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
            <div style="flex: 1;">
              <div style="font-size: 11px; color: var(--gray-500);">
                ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · G${m.matchday || '?'}
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
      }).join('');

      container.innerHTML = `
        <div class="card-title">🏆 Ultimi Risultati</div>
        ${resultsHtml}
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  }
};

window.HomePage = HomePage;