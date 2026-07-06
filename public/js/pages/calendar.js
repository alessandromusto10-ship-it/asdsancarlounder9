const CalendarPage = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-11

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📅 Calendario</h2>
      
      <!-- Navigazione Mese -->
      <div class="flex-between mb-4">
        <button class="icon-btn" id="prev-month" style="background: var(--gray-200);">◀</button>
        <h3 id="current-month-label" style="color: var(--granata);"></h3>
        <button class="icon-btn" id="next-month" style="background: var(--gray-200);">▶</button>
      </div>
      
      <!-- Griglia Calendario -->
      <div class="calendar-grid" id="calendar-grid"></div>
      
      <!-- Sezione "Questa Settimana" (SOTTO il calendario) -->
      <div class="card" id="this-week-section" style="margin-top: 16px;">
        <div class="card-title">📋 Questa Settimana</div>
        <div id="week-events" style="min-height: 60px;"></div>
      </div>
    `;

    document.getElementById('prev-month').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => this.changeMonth(1));
    
    await this.loadMonthCalendar();
    await this.loadWeekForMonth();
	
    // ✅ Auto-aggiorna la settimana quando l'app torna attiva
    if (!this._weekRefreshAttached) {
     document.addEventListener('visibilitychange', () => {
       if (document.visibilityState === 'visible') {
        console.log(' App tornata visibile, aggiorno settimana...');
        this.loadWeekForMonth();
      }
    });
    window.addEventListener('focus', () => this.loadWeekForMonth());
    this._weekRefreshAttached = true;
   }
   
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
    this.loadWeekForMonth();
  },

  async loadWeekForMonth() {
    const container = document.getElementById('week-events');
    const { data: teamData, error: tErr } = await db
      .from('teams')
      .select('id')
      .eq('name', 'S. Carlo Milano')
      .single();
    
    if (tErr || !teamData) {
      container.innerHTML = '<p style="color: var(--danger);">Errore nel caricamento della squadra</p>';
      return;
    }
    
    const sanCarloId = teamData.id;
    const today = new Date();
    const isCurrentMonth = today.getMonth() === this.currentMonth && today.getFullYear() === this.currentYear;
    
    let monday, sunday;
    
    if (isCurrentMonth) {
      // ✅ MESE CORRENTE: mostra la settimana corrente (lunedì-domenica basata su oggi)
      const dayOfWeek = today.getDay(); // 0=Domenica, 1=Lunedì, ..., 6=Sabato
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      
      sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      console.log(`📅 Mese corrente: mostra settimana ${monday.getDate()}-${sunday.getDate()} ${monday.toLocaleDateString('it-IT', { month: 'long' })}`);
    } else {
      // ✅ ALTRO MESE: trova la prima settimana con eventi
      const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
      const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
      
      // Trova il lunedì della prima settimana del mese
      let currentDate = new Date(firstDayOfMonth);
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
      if (daysToMonday > 0) {
        currentDate.setDate(currentDate.getDate() + daysToMonday);
      }
      if (currentDate.getDate() > 1) {
        currentDate.setDate(currentDate.getDate() - 7);
      }
      
      monday = new Date(currentDate);
      monday.setHours(0, 0, 0, 0);
      sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      console.log(`📅 Mese diverso: mostra prima settimana ${monday.getDate()}-${sunday.getDate()} ${monday.toLocaleDateString('it-IT', { month: 'long' })}`);
    }
    
    const startStr = this.formatDate(monday);
    const endStr = this.formatDate(sunday);
    
    console.log(`📅 Cercando eventi dal ${startStr} al ${endStr}`);
    
    // Recupera ALLENAMENTI della settimana
    const { data: trainings, error: trErr } = await db
      .from('trainings')
      .select('*')
      .gte('date', startStr)
      .lte('date', endStr);
    
    // Recupera PARTITE della settimana
    const { data: matches, error: mErr } = await db
      .from('matches')
      .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
      .gte('match_date', startStr)
      .lte('match_date', endStr)
      .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`);
    
    if (trErr) console.error('Errore trainings:', trErr);
    if (mErr) console.error('Errore matches:', mErr);
    
    // Unisci eventi
    const events = [];
    
    if (trainings && trainings.length > 0) {
      trainings.forEach(t => {
        events.push({ type: 'training', data: t, date: t.date });
      });
    }
    
    if (matches && matches.length > 0) {
      matches.forEach(m => {
        const matchDate = m.match_date || m.date;
        events.push({ type: 'match', data: m, date: matchDate });
      });
    }
    
    // Ordina per data
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`📊 Totale eventi questa settimana: ${events.length}`);
    
    if (events.length > 0) {
      this.renderWeekEvents(events);
    } else {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessun evento questa settimana</p>';
    }
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  renderWeekEvents(events) {
    const container = document.getElementById('week-events');
    
    if (!events || events.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessun evento questa settimana</p>';
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
        const matchDate = m.match_date || m.date;
        const dateObj = new Date(matchDate);
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
  },

  async loadMonthCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('current-month-label');
    
    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    
    monthLabel.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
    
    const { data: teamData, error: tErr } = await db
      .from('teams')
      .select('id')
      .eq('name', 'S. Carlo Milano')
      .single();
    
    if (tErr || !teamData) return;
    
    const sanCarloId = teamData.id;
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    const { data: trainings, error: trErr } = await db
      .from('trainings')
      .select('*')
      .gte('date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`)
      .lte('date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    
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
        const day = new Date(m.match_date || m.date).getDate();
        if (!eventsMap[day]) eventsMap[day] = [];
        eventsMap[day].push({ type: 'match', data: m });
      });
    }
    
    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = lastDay;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth;
    const todayDate = today.getDate();
    
    let html = '';
    
    // Header giorni della settimana
    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    weekDays.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Calcola i giorni vuoti all'inizio del mese
    let emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < emptyDays; i++) {
      html += `<div class="calendar-day empty"></div>`;
    }
    
    // Giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === todayDate;
      const hasEvents = eventsMap[day] && eventsMap[day].length > 0;
      const eventCount = eventsMap[day] ? eventsMap[day].length : 0;
      
      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}">
          <span class="day-number">${day}</span>
          ${hasEvents ? `<div class="event-dots">${'•'.repeat(Math.min(eventCount, 3))}</div>` : ''}
        </div>
      `;
    }
    
    container.innerHTML = html;
  }
};

window.CalendarPage = CalendarPage;