const CalendarPage = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-11
  
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📅 Calendario</h2>
      <!-- Sezione "Questa Settimana" -->
      <div class="card" id="this-week-section" style="margin-bottom: 16px;">
        <div class="card-title">📋 Questa Settimana</div>
        <div id="week-events" style="min-height: 60px;"></div>
      </div>
      <!-- Navigazione Mese -->
      <div class="flex-between mb-4" style="display: flex; justify-content: space-between; align-items: center;">
        <button class="icon-btn" id="prev-month" style="background: var(--gray-200); cursor: pointer;">◀</button>
        <h3 id="current-month-label" style="color: var(--granata); margin: 0;"></h3>
        <button class="icon-btn" id="next-month" style="background: var(--gray-200); cursor: pointer;">▶</button>
      </div>
      <!-- Griglia Calendario -->
      <div class="calendar-grid" id="calendar-grid"></div>
      <!-- Lista Eventi del Giorno Selezionato -->
      <div id="day-events-container" class="mt-4" style="display: none;">
        <div class="card">
          <div class="card-title" id="day-events-title">📋 Eventi del giorno</div>
          <div id="day-events-list"></div>
        </div>
      </div>
    `;
    
    // Event listeners
    document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    
    // Caricamento iniziale
    await this.loadMonthCalendar();
    await this.loadWeekEvents();
  },
  
  changeMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.loadMonthCalendar();
    // Aggiorna anche "Questa Settimana" quando cambi mese
    this.loadWeekForMonth();
  },
  
  // Carica la settimana relativa al mese visualizzato
  async loadWeekForMonth() {
    // Calcola la settimana che contiene il 1° del mese visualizzato
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    this.loadWeekEvents(firstDayOfMonth);
  },
  
  async loadMonthCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('current-month-label');
    
    // Nome del mese in italiano
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    monthLabel.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
    
    // Recupera ID squadra S. Carlo
    const { data: teamData, error: tErr } = await db
      .from('teams')
      .select('id')
      .eq('name', 'S. Carlo Milano')
      .single();
    if (tErr || !teamData) return;
    const sanCarloId = teamData.id;
    
    // Calcola correttamente l'ultimo giorno del mese
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    // Recupera allenamenti del mese
    const { data: trainings, error: trErr } = await db
      .from('trainings')
      .select('*')
      .gte('date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`)
      .lte('date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    
    // Recupera partite del mese
    const { data: matches, error: mErr } = await db
      .from('matches')
      .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
      .gte('match_date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`)
      .lte('match_date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`)
      .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`);
    
    if (trErr || mErr) {
      container.innerHTML = '<p style="color: var(--danger);">Errore caricamento</p>';
      return;
    }
    
    // Costruisci mappa eventi per giorno
    const eventsMap = {};
    if (trainings) {
      trainings.forEach(t => {
        const day = new Date(t.date).getDate();
        if (!eventsMap[day]) eventsMap[day] = [];
        eventsMap[day].push({ type: 'training', data: t });
      });
    }
    if (matches) {
      matches.forEach(m => {
        const day = new Date(m.match_date).getDate();
        if (!eventsMap[day]) eventsMap[day] = [];
        eventsMap[day].push({ type: 'match', data: m });
      });
    }
    
    // Genera griglia calendario
    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = lastDay;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth;
    const todayDate = today.getDate();
    let html = '';
    
    // Header giorni della settimana (Lun-Dom)
    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    weekDays.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Giorni vuoti prima del 1°
    const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < emptyDays; i++) {
      html += `<div class="calendar-day empty"></div>`;
    }
    
    // Giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === todayDate;
      const hasEvents = eventsMap[day] && eventsMap[day].length > 0;
      const eventCount = eventsMap[day] ? eventsMap[day].length : 0;
      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}" 
             onclick="CalendarPage.showDayEvents(${day})" style="cursor: pointer;">
          <span class="day-number">${day}</span>
          ${hasEvents ? `<div class="event-dots">${'•'.repeat(Math.min(eventCount, 3))}</div>` : ''}
        </div>
      `;
    }
    
    container.innerHTML = html;
    // Salva eventiMap per uso in showDayEvents
    this.eventsMap = eventsMap;
  },
  
  async showDayEvents(day) {
    const container = document.getElementById('day-events-container');
    const title = document.getElementById('day-events-title');
    const list = document.getElementById('day-events-list');
    
    if (!this.eventsMap || !this.eventsMap[day]) {
      container.style.display = 'none';
      return;
    }
    
    const events = this.eventsMap[day];
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    title.textContent = `📋 ${day} ${monthNames[this.currentMonth]} ${this.currentYear}`;
    
    let html = '';
    events.forEach(ev => {
      if (ev.type === 'training') {
        const t = ev.data;
        const dateObj = new Date(t.date);
        const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'long' });
        html += `
          <div class="card" style="background: rgba(122,31,46,0.08); border-left: 4px solid var(--granata); margin-bottom: 8px;">
            <div style="font-weight: 700; color: var(--granata);">🏃 Allenamento</div>
            <div style="margin-top: 6px; font-size: 14px;">
              📅 ${dayName} ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}<br>
              ⏰ ${formatTime(t.time)}<br>
              ${t.location ? '📍 ' + t.location + '<br>' : ''}
              ${t.notes ? '📝 ' + t.notes : ''}
            </div>
          </div>
        `;
      } else if (ev.type === 'match') {
        const m = ev.data;
        const homeName = m.home_team?.name || 'Casa';
        const awayName = m.away_team?.name || 'Ospite';
        const score = (m.home_won_periods !== null && m.away_won_periods !== null)
          ? `${m.home_won_periods} - ${m.away_won_periods}`
          : 'vs';
        const dateObj = new Date(m.match_date);
        const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'long' });
        html += `
          <div class="card" style="background: rgba(245,158,11,0.08); border-left: 4px solid var(--warning); margin-bottom: 8px;">
            <div style="font-weight: 700; color: var(--warning);">⚽ Partita · ${m.match_type === 'andata' ? 'Andata' : 'Ritorno'} G${m.matchday || '?'}</div>
            <div style="margin-top: 6px; font-size: 14px;">
              📅 ${dayName} ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}<br>
              ⏰ ${m.match_time ? formatTime(m.match_time) : 'n.d.'}<br>
              🏠 ${homeName} ${score} ${awayName}<br>
              ${m.location ? '📍 ' + m.location : ''}
            </div>
          </div>
        `;
      }
    });
    
    list.innerHTML = html;
    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  
  // Carica la settimana corretta in base al mese visualizzato
  async loadWeekEvents(startDate = null) {
    const container = document.getElementById('week-events');
    // Se non viene passata una data, usa oggi (comportamento originale)
    // Altrimenti usa la data passata (quando si cambia mese)
    const baseDate = startDate || new Date();
    
    // Calcola inizio e fine settimana (da lunedì a domenica)
    const dayOfWeek = baseDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Recupera ID squadra S. Carlo
    const { data: teamData, error: tErr } = await db
      .from('teams')
      .select('id')
      .eq('name', 'S. Carlo Milano')
      .single();
    if (tErr || !teamData) {
      container.innerHTML = '<p style="color: var(--gray-500);">Errore caricamento</p>';
      return;
    }
    const sanCarloId = teamData.id;
    
    // ✅ FIX: Scorri avanti fino a trovare una settimana con eventi (max 4 settimane)
    let currentMonday = new Date(monday);
    let currentSunday = new Date(sunday);
    let events = [];
    let attempts = 0;
    const maxAttempts = 4; // massimo 4 settimane avanti
    
    while (attempts < maxAttempts && events.length === 0) {
      const startStr = currentMonday.toISOString().split('T')[0];
      const endStr = currentSunday.toISOString().split('T')[0];
      
      // Recupera allenamenti della settimana
      const { data: trainings, error: trErr } = await db
        .from('trainings')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr);
      
      // Recupera partite della settimana
      const { data: matches, error: mErr } = await db
        .from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .gte('match_date', startStr)
        .lte('match_date', endStr)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`);
      
      if (trErr || mErr) break;
      
      // Unisci e ordina per data
      if (trainings) trainings.forEach(t => events.push({ type: 'training', data: t, date: t.date }));
      if (matches) matches.forEach(m => events.push({ type: 'match', data: m, date: m.match_date }));
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Se non ci sono eventi, vai alla settimana successiva
      if (events.length === 0) {
        currentMonday.setDate(currentMonday.getDate() + 7);
        currentSunday.setDate(currentSunday.getDate() + 7);
        attempts++;
      }
    }
    
    if (events.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessun evento nelle prossime settimane</p>';
      return;
    }
    
    let html = '';
    events.forEach(ev => {
      if (ev.type === 'training') {
        const t = ev.data;
        const dateObj = new Date(t.date);
        const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'long' });
        html += `
          <div class="card" style="background: rgba(122,31,46,0.08); border-left: 4px solid var(--granata); margin-bottom: 8px;">
            <div style="font-weight: 700; color: var(--granata);">🏃 Allenamento</div>
            <div style="margin-top: 6px; font-size: 14px;">
              📅 ${dayName} ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}<br>
              ⏰ ${formatTime(t.time)}<br>
              ${t.location ? '📍 ' + t.location + '<br>' : ''}
              ${t.notes ? '📝 ' + t.notes : ''}
            </div>
          </div>
        `;
      } else if (ev.type === 'match') {
        const m = ev.data;
        const homeName = m.home_team?.name || 'Casa';
        const awayName = m.away_team?.name || 'Ospite';
        const score = (m.home_won_periods !== null && m.away_won_periods !== null)
          ? `${m.home_won_periods} - ${m.away_won_periods}`
          : 'vs';
        const dateObj = new Date(m.match_date);
        const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'long' });
        html += `
          <div class="card" style="background: rgba(245,158,11,0.08); border-left: 4px solid var(--warning); margin-bottom: 8px;">
            <div style="font-weight: 700; color: var(--warning);">⚽ Partita · ${m.match_type === 'andata' ? 'Andata' : 'Ritorno'} G${m.matchday || '?'}</div>
            <div style="margin-top: 6px; font-size: 14px;">
              📅 ${dayName} ${dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}<br>
              ⏰ ${m.match_time ? formatTime(m.match_time) : 'n.d.'}<br>
              🏠 ${homeName} ${score} ${awayName}<br>
              ${m.location ? '📍 ' + m.location : ''}
            </div>
          </div>
        `;
      }
    });
    
    container.innerHTML = html;
  }
};

window.CalendarPage = CalendarPage;