const CalendarPage = {
  currentDate: new Date(),
  SANCARLO_TEAM_NAME: 'S. Carlo Milano',

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📅 Calendario</h2>

      <!-- Legenda -->
      <div class="card" style="margin-bottom: 12px; padding: 10px 16px;">
        <div style="display: flex; gap: 16px; font-size: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 12px; height: 12px; border-radius: 3px; background: var(--granata);"></span>
            <span>Allenamento</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 12px; height: 12px; border-radius: 3px; background: #2563eb;"></span>
            <span>Partita</span>
          </div>
        </div>
      </div>

      <!-- Navigazione mese -->
      <div class="card">
        <div class="calendar-header">
          <button class="icon-btn" id="prev-month" style="background: var(--white); color: var(--granata); border: 1px solid var(--gray-300);">◀</button>
          <h2 id="month-title" style="font-size: 16px; color: var(--granata); text-transform: capitalize;"></h2>
          <button class="icon-btn" id="next-month" style="background: var(--white); color: var(--granata); border: 1px solid var(--gray-300);">▶</button>
        </div>
        <div class="calendar-grid" id="calendar-grid">
          <div class="spinner" style="grid-column: 1 / -1;"></div>
        </div>
      </div>

      <!-- Lista eventi del mese -->
      <div class="card mt-4">
        <div class="card-title"> Eventi del Mese</div>
        <div id="events-list">
          <div class="spinner"></div>
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

    await this.renderCalendar();
  },

  async renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                        'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    document.getElementById('month-title').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    const eventsList = document.getElementById('events-list');
    grid.innerHTML = '<div class="spinner" style="grid-column: 1 / -1;"></div>';
    eventsList.innerHTML = '<div class="spinner"></div>';

    try {
      // Carica allenamenti del mese
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const [trainingsRes, matchesRes, teamRes] = await Promise.all([
        db.from('trainings').select('*').gte('date', startDate).lte('date', endDate),
        db.from('matches').select(`*, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)`).gte('match_date', startDate).lte('match_date', endDate),
        db.from('teams').select('id').eq('name', this.SANCARLO_TEAM_NAME).single()
      ]);

      if (trainingsRes.error) throw trainingsRes.error;
      if (matchesRes.error) throw matchesRes.error;

      const trainings = trainingsRes.data || [];
      let allMatches = matchesRes.data || [];
      
      // Filtra solo partite di S. Carlo Milano
      if (teamRes.data) {
        const sanCarloId = teamRes.data.id;
        allMatches = allMatches.filter(m => 
          m.home_team_id === sanCarloId || m.away_team_id === sanCarloId
        );
      } else {
        allMatches = [];
      }

      // Mappa eventi per giorno
      const eventsByDay = {};
      trainings.forEach(t => {
        const key = t.date;
        if (!eventsByDay[key]) eventsByDay[key] = { trainings: [], matches: [] };
        eventsByDay[key].trainings.push(t);
      });
      allMatches.forEach(m => {
        const key = m.match_date;
        if (!eventsByDay[key]) eventsByDay[key] = { trainings: [], matches: [] };
        eventsByDay[key].matches.push(m);
      });

      // Costruisci griglia calendario
      const firstDay = new Date(year, month, 1);
      const lastDate = new Date(year, month + 1, 0);
      const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Lun = 0
      const totalDays = lastDate.getDate();
      const today = new Date().toISOString().split('T')[0];

      const dayNames = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
      let html = dayNames.map(d => `<div class="calendar-day-name">${d}</div>`).join('');

      // Giorni vuoti prima del primo
      for (let i = 0; i < startDayOfWeek; i++) {
        html += `<div class="calendar-day other-month"></div>`;
      }

      // Giorni del mese
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const events = eventsByDay[dateStr];
        const isToday = dateStr === today;
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        
        let content = `<div style="font-size: 11px; font-weight: ${isToday ? '700' : '500'};">${day}</div>`;
        
        if (events) {
          // Mostra allenamenti (max 2)
          if (events.trainings.length > 0) {
            events.trainings.slice(0, 2).forEach(t => {
              content += `
                <div style="font-size: 8px; color: var(--granata); font-weight: 600; line-height: 1.1; margin-top: 1px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
                  🏃 ${formatTime(t.time)}
                </div>
              `;
            });
          }
          // Mostra partite (max 1)
          if (events.matches.length > 0) {
            const m = events.matches[0];
            const isHome = m.home_team_id === teamRes.data?.id;
            const opponent = isHome ? m.away_team?.name : m.home_team?.name;
            const shortOpponent = opponent ? opponent.split(' ').pop() : '?';
            content += `
              <div style="font-size: 8px; color: #2563eb; font-weight: 600; line-height: 1.1; margin-top: 1px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
                ⚽ vs ${shortOpponent}
              </div>
            `;
          }
        }
        
        html += `<div class="${classes}" data-date="${dateStr}">${content}</div>`;
      }

      grid.innerHTML = html;

      // Click su giorno
      grid.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
          this.showDayEvents(dayEl.dataset.date, eventsByDay[dayEl.dataset.date]);
        });
      });

      // Lista eventi del mese
      this.renderEventsList(trainings, allMatches, teamRes.data);

    } catch (err) {
      grid.innerHTML = `<p style="color: var(--danger); grid-column: 1 / -1;">Errore: ${err.message}</p>`;
      eventsList.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  renderEventsList(trainings, matches, teamData) {
    const container = document.getElementById('events-list');
    
    // Unisci e ordina per data
    const allEvents = [
      ...trainings.map(t => ({ ...t, type: 'training', date: t.date })),
      ...matches.map(m => ({ ...m, type: 'match', date: m.match_date }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (allEvents.length === 0) {
      container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessun evento questo mese</p>';
      return;
    }

    let html = '';
    allEvents.forEach(ev => {
      const dateObj = new Date(ev.date);
      const dateStr = dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
      
      if (ev.type === 'training') {
        html += `
          <div class="attendance-row" style="border-left: 3px solid var(--granata); padding-left: 12px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--granata); font-size: 14px;"> Allenamento</div>
              <div style="font-size: 12px; color: var(--gray-700); margin-top: 2px;">
                📅 ${dateStr} ·  ${formatTime(ev.time)} ${ev.location ? '· 📍 ' + ev.location : ''}
              </div>
            </div>
          </div>
        `;
      } else {
        const isHome = ev.home_team_id === teamData?.id;
        const opponent = isHome ? ev.away_team?.name : ev.home_team?.name;
        const location = ev.location || (isHome ? 'Casa' : 'Trasferta');
        
        html += `
          <div class="attendance-row" style="border-left: 3px solid #2563eb; padding-left: 12px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #2563eb; font-size: 14px;">⚽ Partita - G${ev.matchday || '?'}</div>
              <div style="font-size: 12px; color: var(--gray-700); margin-top: 2px;">
                📅 ${dateStr} · ⏰ ${formatTime(ev.match_time || 'TBD')} · 📍 ${location}
              </div>
              <div style="font-size: 12px; color: var(--gray-700); margin-top: 2px;">
                <strong>S. Carlo Milano</strong> vs <strong>${opponent || '?'}</strong>
                ${isHome ? '🏠' : '✈️'}
              </div>
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
  },

  showDayEvents(dateStr, events) {
    const dateObj = new Date(dateStr);
    const dateFormatted = dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    
    let html = `<div style="font-weight: 700; color: var(--granata); margin-bottom: 12px; font-size: 16px; text-transform: capitalize;">📅 ${dateFormatted}</div>`;
    
    if (!events || (events.trainings.length === 0 && events.matches.length === 0)) {
      html += '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nessun evento in questo giorno</p>';
    } else {
      if (events.trainings.length > 0) {
        html += '<div style="margin-bottom: 12px;">';
        events.trainings.forEach(t => {
          html += `
            <div style="background: rgba(122,31,46,0.05); border-left: 3px solid var(--granata); padding: 10px 12px; border-radius: 8px; margin-bottom: 8px;">
              <div style="font-weight: 600; color: var(--granata);">🏃 Allenamento</div>
              <div style="font-size: 13px; color: var(--gray-700); margin-top: 4px;">
                ⏰ ${formatTime(t.time)} ${t.location ? '· 📍 ' + t.location : ''}
              </div>
            </div>
          `;
        });
        html += '</div>';
      }
      
      if (events.matches.length > 0) {
        html += '<div>';
        events.matches.forEach(m => {
          const isHome = m.home_team?.name === this.SANCARLO_TEAM_NAME;
          const opponent = isHome ? m.away_team?.name : m.home_team?.name;
          html += `
            <div style="background: rgba(37,99,235,0.05); border-left: 3px solid #2563eb; padding: 10px 12px; border-radius: 8px;">
              <div style="font-weight: 600; color: #2563eb;">⚽ Partita - G${m.matchday || '?'} ${m.match_type === 'andata' ? '(Andata)' : '(Ritorno)'}</div>
              <div style="font-size: 13px; color: var(--gray-700); margin-top: 4px;">
                <strong>S. Carlo Milano</strong> vs <strong>${opponent || '?'}</strong>
                ${isHome ? '🏠 Casa' : '✈️ Trasferta'}
              </div>
              <div style="font-size: 13px; color: var(--gray-700); margin-top: 4px;">
                ⏰ ${formatTime(m.match_time || 'TBD')} ${m.location ? '· 📍 ' + m.location : ''}
              </div>
            </div>
          `;
        });
        html += '</div>';
      }
    }
    
    // Mostra in un modal semplice
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px;';
    modal.innerHTML = `
      <div class="card" style="max-width: 400px; width: 100%; max-height: 80vh; overflow-y: auto;">
        ${html}
        <button class="btn btn-secondary btn-block" style="margin-top: 16px;">Chiudi</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('button').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
};

window.CalendarPage = CalendarPage;