const CalendarPage = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  
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
  
  // ✅ Trova la PRIMA settimana del mese che ha eventi
  async loadWeekForMonth() {
    const container = document.getElementById('week-events');
    
    const { data: teamData, error: tErr } = await db
      .from('teams')
      .select('id')
      .eq('name', 'S. Carlo Milano')
      .single();
    if (tErr || !teamData) return;
    const sanCarloId = teamData.id;
    
    // Calcola primo e ultimo giorno del mese
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Scorri le settimane del mese (max 5)
    let currentWeekStart = new Date(firstDayOfMonth);
    for (let week = 0; week < 5; week++) {
      // Calcola lunedì e domenica della settimana
      const dayOfWeek = currentWeekStart.getDay();
      const mondayOffset = dayOfWeek === 0 ? 0 : 1 - dayOfWeek;
      const monday = new Date(currentWeekStart);
      monday.setDate(currentWeekStart.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      // Se il lunedì è oltre il mese, fermati
      if (monday > lastDayOfMonth) break;
      
      const startStr = monday.toISOString().split('T')[0];
      const endStr = sunday.toISOString().split('T')[0];
      
      // Recupera ALLENAMENTI
      const { data: trainings, error: trErr } = await db
        .from('trainings')
        .select('*')
        .gte('date', startStr)
        .lte('date', endStr);
      
      // Recupera PARTITE
      const { data: matches, error: mErr } = await db
        .from('matches')
        .select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`)
        .gte('match_date', startStr)
        .lte('match_date', endStr)
        .or(`home_team_id.eq.${sanCarloId},away_team_id.eq.${sanCarloId}`);
      
      if (trErr || mErr) continue;
      
      // Unisci eventi
      const events = [];
      if (trainings) trainings.forEach(t => events.push({ type: 'training', data: t, date: t.date }));
      if (matches) matches.forEach(m => events.push({ type: 'match', data: m, date: m.match_date }));
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Se trovi eventi, mostrali
      if (events.length > 0) {
        this.renderWeekEvents(events);
        return;
      }
      
      // Altrimenti vai alla settimana successiva
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    // Nessun evento
    container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessun evento programmato questo mese</p>';
  },
  
  renderWeekEvents(events) {
    const container = document.getElementById('week-events');
    
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
    
    // Recupera ALLENAMENTI del mese
    const { data: trainings, error: trErr } = await db
      .from('trainings')
      .select('*')
      .gte('date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`)
      .lte('date', `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    
    // Recupera PARTITE del mese
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
    
    // Costruisci mappa eventi
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
    
    // Genera griglia
    const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = lastDay;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === this.currentYear && today.getMonth() === this.currentMonth;
    const todayDate = today.getDate();
    let html = '';
    
    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    weekDays.forEach(day => {
      html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    const emptyDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < emptyDays; i++) {
      html += `<div class="calendar-day empty"></div>`;
    }
    
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