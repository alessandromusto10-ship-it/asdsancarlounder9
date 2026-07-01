const CalendarPage = {
  currentDate: new Date(),
  events: [],

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📅 Calendario</h2>
      
      <div class="calendar-header">
        <button class="icon-btn" id="prev-month" style="background: var(--white); color: var(--granata); border: 1px solid var(--gray-300);">◀</button>
        <h2 id="month-title" style="font-size: 16px;"></h2>
        <button class="icon-btn" id="next-month" style="background: var(--white); color: var(--granata); border: 1px solid var(--gray-300);">▶</button>
      </div>

      <div class="calendar-grid" id="calendar-grid"></div>

      <div class="card mt-4">
        <div class="card-title">📌 Legenda</div>
        <div style="display: flex; gap: 16px; font-size: 13px; flex-wrap: wrap;">
          <div><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background: var(--granata); margin-right: 6px;"></span>Allenamento</div>
          <div><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background: var(--warning); margin-right: 6px;"></span>Partita</div>
        </div>
      </div>

      <!-- Modale dettaglio giorno -->
      <div id="day-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px;">
        <div class="card" style="max-width: 400px; width: 100%; max-height: 80vh; overflow-y: auto;">
          <div class="flex-between mb-4">
            <h3 id="modal-title" style="color: var(--granata);"></h3>
            <button class="icon-btn" id="close-modal" style="background: var(--gray-200); color: var(--gray-700);">✕</button>
          </div>
          <div id="modal-content"></div>
        </div>
      </div>
    `;

    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('day-modal').classList.add('hidden');
    });

    await this.loadEvents();
    this.renderCalendar();
  },

  async loadEvents() {
    const start = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    const end = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 2, 0);
    const [trainingsRes, matchesRes] = await Promise.all([
      db.from('trainings').select('*').gte('date', start.toISOString().split('T')[0]).lte('date', end.toISOString().split('T')[0]),
      db.from('matches').select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`).gte('match_date', start.toISOString().split('T')[0]).lte('match_date', end.toISOString().split('T')[0])
    ]);

    this.events = [];
    if (trainingsRes.data) {
      trainingsRes.data.forEach(t => {
        this.events.push({ date: t.date, type: 'training', data: t });
      });
    }
    if (matchesRes.data) {
      matchesRes.data.forEach(m => {
        this.events.push({ date: m.match_date, type: 'match', data: m });
      });
    }
  },

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    document.getElementById('month-title').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const today = new Date().toISOString().split('T')[0];

    // ✅ NOMI GIORNI ABBREVIATI (2 lettere) per mobile
    const dayNames = ['L','M','M','G','V','S','D'];
    let html = dayNames.map(d => `<div class="calendar-day-name" style="font-size: 11px;">${d}</div>`).join('');

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      html += `<div class="calendar-day other-month" style="font-size: 12px;">${d}</div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = this.events.filter(e => e.date === dateStr);
      const hasTraining = dayEvents.some(e => e.type === 'training');
      const hasMatch = dayEvents.some(e => e.type === 'match');
      
      let dots = '';
      if (hasTraining && hasMatch) {
        dots = '<div style="display:flex; gap:2px; position:absolute; bottom:3px; left:50%; transform:translateX(-50%);"><span style="width:4px;height:4px;border-radius:50%;background:var(--granata);"></span><span style="width:4px;height:4px;border-radius:50%;background:var(--warning);"></span></div>';
      } else if (hasTraining) {
        dots = '<div style="position:absolute; bottom:3px; left:50%; transform:translateX(-50%); width:4px; height:4px; border-radius:50%; background: var(--granata);"></div>';
      } else if (hasMatch) {
        dots = '<div style="position:absolute; bottom:3px; left:50%; transform:translateX(-50%); width:4px; height:4px; border-radius:50%; background: var(--warning);"></div>';
      }
      
      const isToday = dateStr === today ? ' today' : '';
      const hasEvent = dayEvents.length > 0 ? ' has-event' : '';
      
      html += `<div class="calendar-day${isToday}${hasEvent}" data-date="${dateStr}" style="font-size: 12px; padding: 6px 2px;">${d}${dots}</div>`;
    }

    const totalCells = startDayOfWeek + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      html += `<div class="calendar-day other-month" style="font-size: 12px;">${d}</div>`;
    }

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = html;

    grid.querySelectorAll('.calendar-day:not(.other-month)').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.dataset.date;
        const dayEvents = this.events.filter(e => e.date === dateStr);
        if (dayEvents.length > 0) {
          this.showDayModal(dateStr, dayEvents);
        }
      });
    });
  },

  showDayModal(dateStr, events) {
    const dateObj = new Date(dateStr);
    const title = dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('modal-title').textContent = title;
    let html = '';
    events.forEach(ev => {
      if (ev.type === 'training') {
        const t = ev.data;
        html += `
          <div class="card" style="background: rgba(122,31,46,0.05); border-left: 4px solid var(--granata);">
            <div style="font-weight: 700; color: var(--granata);">🏃 Allenamento</div>
            <div style="margin-top: 6px; font-size: 14px;">
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
        html += `
          <div class="card" style="background: rgba(245,158,11,0.08); border-left: 4px solid var(--warning);">
            <div style="font-weight: 700; color: var(--warning);">⚽ Partita · ${m.match_type === 'andata' ? 'Andata' : 'Ritorno'} G${m.matchday || '?'}</div>
            <div style="margin-top: 8px; text-align: center;">
              <div style="font-size: 15px; font-weight: 600;">${homeName} ${score} ${awayName}</div>
              <div style="margin-top: 4px; font-size: 13px; color: var(--gray-700);">
                ⏰ ${m.match_time ? formatTime(m.match_time) : 'n.d.'}
                ${m.location ? ' · 📍 ' + m.location : ''}
              </div>
            </div>
          </div>
        `;
      }
    });

    document.getElementById('modal-content').innerHTML = html || '<p style="color: var(--gray-500);">Nessun evento</p>';
    document.getElementById('day-modal').classList.remove('hidden');
  }
};

window.CalendarPage = CalendarPage;