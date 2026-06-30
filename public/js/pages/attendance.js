const AttendancePage = {
  currentMonth: new Date(),
  currentTrainingId: null,
  isMister: false,
  myChildId: null,

  async render() {
    const view = document.getElementById('view');
    const { profile, user } = await Auth.getCurrentUser();
    this.isMister = profile.role === 'mister';
    
    // Se genitore, recupera l'ID del figlio (controlla entrambi gli slot)
    if (!this.isMister) {
      const { data: player } = await db
        .from('players')
        .select('id, first_name, last_name')
        .or(`parent_id.eq.${user.id},parent_id_2.eq.${user.id}`)
        .single();
      this.myChildId = player?.id;
      
      if (!this.myChildId) {
        view.innerHTML = `
          <div class="card text-center" style="margin-top: 40px;">
            <h2 style="color: var(--granata);">⚠️ Account non collegato</h2>
            <p style="margin: 12px 0; color: var(--gray-500);">
              Il tuo account non è ancora associato a un giocatore.<br>
              Contatta il mister per completare la registrazione.
            </p>
            <button class="btn btn-primary" onclick="Router.navigate('/')">Torna alla Home</button>
          </div>
        `;
        return;
      }
    }

    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">
        ${this.isMister ? '📝 Gestione Presenze' : '🏃 Conferma Presenza'}
      </h2>

      ${!this.isMister ? `
        <div class="card" style="background: rgba(122,31,46,0.05); border-left: 4px solid var(--granata);">
          <div style="font-size: 13px; color: var(--gray-700);">
            👦 Conferma per: <strong>${await this.getChildName()}</strong>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="calendar-header">
          <button class="icon-btn" id="prev-month" style="background: var(--white); color: var(--granata); border: 1px solid var(--gray-300);">◀</button>
          <h2 id="month-title" style="font-size: 16px; color: var(--granata); text-transform: capitalize;"></h2>
          <button class="icon-btn" id="next-month" style="background: var(--white); color: var(--granata); border: 1px solid var(--gray-300);">▶</button>
        </div>
        <div id="trainings-list">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Pannello dettaglio allenamento -->
      <div id="training-detail" class="card hidden">
        <div class="flex-between mb-4">
          <div>
            <div class="card-title" style="margin-bottom: 4px;" id="detail-title">-</div>
            <div id="detail-subtitle" style="font-size: 13px; color: var(--gray-500);"></div>
          </div>
          <button class="icon-btn" id="close-detail" style="background: var(--gray-200); color: var(--gray-700);">✕</button>
        </div>
        <div id="week-notice" class="hidden" style="background: rgba(245,158,11,0.1); border-left: 3px solid var(--warning); padding: 10px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; color: var(--gray-700);">
          🔒 Questo allenamento è fuori dalla settimana corrente. Le presenze non sono modificabili.
        </div>
        <div id="players-list"></div>
      </div>
    `;

    // Navigation mesi
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
      this.loadTrainings();
    });
    document.getElementById('next-month').addEventListener('click', () => {
      this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
      this.loadTrainings();
    });
    document.getElementById('close-detail').addEventListener('click', () => {
      document.getElementById('training-detail').classList.add('hidden');
      this.currentTrainingId = null;
    });

    await this.loadTrainings();
  },

  async getChildName() {
    if (!this.myChildId) return '';
    const { data } = await db
      .from('players')
      .select('first_name, last_name')
      .eq('id', this.myChildId)
      .single();
    return data ? `${data.last_name} ${data.first_name}` : '';
  },

  // Calcola inizio e fine settimana corrente (lun-dom)
  getCurrentWeekBounds() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0 = dom, 1 = lun, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  },

  isTrainingInCurrentWeek(trainingDate) {
    const { start, end } = this.getCurrentWeekBounds();
    const d = new Date(trainingDate);
    d.setHours(12, 0, 0, 0);
    return d >= start && d <= end;
  },

  async loadTrainings() {
    const container = document.getElementById('trainings-list');
    container.innerHTML = '<div class="spinner"></div>';
    
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                        'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    document.getElementById('month-title').textContent = `${monthNames[month]} ${year}`;
    
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;
    
    try {
      const { data: trainings, error } = await db
        .from('trainings')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (error) throw error;
      
      if (!trainings || trainings.length === 0) {
        container.innerHTML = `
          <p style="color: var(--gray-500); text-align: center; padding: 20px;">
             Nessun allenamento in questo mese
          </p>
        `;
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const { start: weekStart, end: weekEnd } = this.getCurrentWeekBounds();
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      let html = '';
      trainings.forEach(t => {
        const dateObj = new Date(t.date);
        const isInWeek = this.isTrainingInCurrentWeek(t.date);
        const isPast = t.date < today;
        
        let statusBadge = '';
        if (isInWeek) {
          statusBadge = '<span class="badge badge-warning">️ Modificabile</span>';
        } else if (isPast) {
          statusBadge = '<span class="badge badge-granata">✓ Passato</span>';
        } else {
          statusBadge = '<span class="badge" style="background: var(--gray-200); color: var(--gray-700);">🔒 Futuro</span>';
        }
        
        // Per i genitori: evidenzia se la presenza è già stata confermata
        let confirmedInfo = '';
        if (!this.isMister) {
          confirmedInfo = `<span id="conf-${t.id}" style="font-size: 11px; color: var(--gray-500);"></span>`;
        }
        
        html += `
          <div class="attendance-row" data-training-id="${t.id}" style="cursor: pointer;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <strong style="color: var(--granata);">
                  ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
                </strong>
                ${statusBadge}
                ${confirmedInfo}
              </div>
              <div style="font-size: 13px; color: var(--gray-700); margin-top: 4px;">
                 ${formatTime(t.time)} ${t.location ? '· 📍 ' + t.location : ''}
              </div>
            </div>
            <div style="color: var(--granata); font-size: 20px;">›</div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      // Click su allenamento
      container.querySelectorAll('.attendance-row').forEach(row => {
        row.addEventListener('click', () => {
          this.openTraining(row.dataset.trainingId);
        });
      });
      
      // Per i genitori: carica lo stato di conferma per ogni allenamento
      if (!this.isMister && this.myChildId) {
        this.loadConfirmationStatus(trainings);
      }
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async loadConfirmationStatus(trainings) {
    const trainingIds = trainings.map(t => t.id);
    const { data } = await db
      .from('attendances')
      .select('training_id, status')
      .in('training_id', trainingIds)
      .eq('player_id', this.myChildId);
    
    if (!data) return;
    
    const statusMap = {};
    data.forEach(a => { statusMap[a.training_id] = a.status; });
    
    trainings.forEach(t => {
      const el = document.getElementById(`conf-${t.id}`);
      if (!el) return;
      const status = statusMap[t.id];
      if (status === 'presente') {
        el.innerHTML = ' · <span style="color: var(--success); font-weight: 600;">✅ Confermato</span>';
      } else if (status === 'assente') {
        el.innerHTML = ' · <span style="color: var(--danger); font-weight: 600;">❌ Assente</span>';
      } else if (status === 'giustificato') {
        el.innerHTML = ' · <span style="color: var(--warning); font-weight: 600;">⚠️ Giustificato</span>';
      } else {
        el.innerHTML = ' · <span style="color: var(--gray-500);">⏳ Da confermare</span>';
      }
    });
  },

  async openTraining(trainingId) {
    this.currentTrainingId = trainingId;
    const detail = document.getElementById('training-detail');
    detail.classList.remove('hidden');
    document.getElementById('players-list').innerHTML = '<div class="spinner"></div>';
    
    // Scroll al dettaglio
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Carica allenamento
    const { data: training } = await db
      .from('trainings')
      .select('*')
      .eq('id', trainingId)
      .single();
    
    if (!training) return;
    
    const dateObj = new Date(training.date);
    document.getElementById('detail-title').textContent = 
      ` ${dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' })}`;
    document.getElementById('detail-subtitle').textContent = 
      `⏰ ${formatTime(training.time)}${training.location ? ' · 📍 ' + training.location : ''}`;
    
    const isInWeek = this.isTrainingInCurrentWeek(training.date);
    const weekNotice = document.getElementById('week-notice');
    
    // Per i genitori: blocca se non è settimana corrente
    // Per i mister: sempre modificabile
    if (!this.isMister && !isInWeek) {
      weekNotice.classList.remove('hidden');
    } else {
      weekNotice.classList.add('hidden');
    }
    
    await this.loadPlayersForTraining(trainingId, isInWeek);
  },

  async loadPlayersForTraining(trainingId, canEdit) {
    const container = document.getElementById('players-list');
    
    try {
      // Carica giocatori (tutti per mister, solo figlio per genitore)
      let playersQuery = db.from('players').select('id, first_name, last_name, role').order('last_name');
      
      if (!this.isMister && this.myChildId) {
        playersQuery = playersQuery.eq('id', this.myChildId);
      }
      
      const { data: players, error: pErr } = await playersQuery;
      if (pErr) throw pErr;
      
      if (!players || players.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center;">Nessun giocatore</p>';
        return;
      }
      
      // Carica presenze esistenti
      const { data: attendances } = await db
        .from('attendances')
        .select('player_id, status')
        .eq('training_id', trainingId);
      
      const statusMap = {};
      if (attendances) {
        attendances.forEach(a => { statusMap[a.player_id] = a.status; });
      }
      
      const roleEmoji = {
        'portiere': '🧤',
        'difensore': '🛡️',
        'centrocampista': '',
        'attaccante': ''
      };
      
      let html = '';
      players.forEach(p => {
        const status = statusMap[p.id] || 'assente';
        const emoji = roleEmoji[p.role] || '';
        const editable = canEdit || this.isMister;
        
        html += `
          <div class="attendance-row" data-player-id="${p.id}">
            <div style="flex: 1;">
              <div style="font-weight: 600;">${emoji} ${p.last_name} ${p.first_name}</div>
              ${p.role ? `<div style="font-size: 11px; color: var(--gray-500); text-transform: capitalize;">${p.role}</div>` : ''}
            </div>
            <div class="attendance-buttons">
              <button class="att-btn ${status === 'presente' ? 'active-presente' : ''}" 
                      data-status="presente" ${!editable ? 'disabled' : ''}>✅</button>
              <button class="att-btn ${status === 'assente' ? 'active-assente' : ''}" 
                      data-status="assente" ${!editable ? 'disabled' : ''}>❌</button>
              <button class="att-btn ${status === 'giustificato' ? 'active-giustificato' : ''}" 
                      data-status="giustificato" ${!editable ? 'disabled' : ''}>️</button>
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
      
      // Bind click sui pulsanti
      if (canEdit || this.isMister) {
        container.querySelectorAll('.att-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const row = btn.closest('.attendance-row');
            const playerId = row.dataset.playerId;
            const status = btn.dataset.status;
            await this.setAttendance(trainingId, playerId, status, row);
          });
        });
      }
      
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async setAttendance(trainingId, playerId, status, rowEl) {
    // Aggiorna UI immediatamente
    rowEl.querySelectorAll('.att-btn').forEach(b => {
      b.classList.remove('active-presente', 'active-assente', 'active-giustificato');
    });
    const activeBtn = rowEl.querySelector(`.att-btn[data-status="${status}"]`);
    activeBtn.classList.add(`active-${status}`);
    
    try {
      const { profile } = await Auth.getCurrentUser();
      
      // Upsert: inserisci o aggiorna
      const { error } = await db
        .from('attendances')
        .upsert({
          training_id: trainingId,
          player_id: playerId,
          status: status,
          confirmed_at: new Date().toISOString(),
          confirmed_by: profile.id
        }, {
          onConflict: 'training_id,player_id'
        });
      
      if (error) throw error;
      
      // Aggiorna anche lo stato nella lista allenamenti (per i genitori)
      if (!this.isMister) {
        const confEl = document.getElementById(`conf-${trainingId}`);
        if (confEl) {
          if (status === 'presente') {
            confEl.innerHTML = ' · <span style="color: var(--success); font-weight: 600;">✅ Confermato</span>';
          } else if (status === 'assente') {
            confEl.innerHTML = ' · <span style="color: var(--danger); font-weight: 600;">❌ Assente</span>';
          } else {
            confEl.innerHTML = ' · <span style="color: var(--warning); font-weight: 600;">⚠️ Giustificato</span>';
          }
        }
      }
      
      toast('Presenza aggiornata ✅', 'success');
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
      // Reload per ripristinare stato
      this.loadPlayersForTraining(trainingId, this.isTrainingInCurrentWeek(trainingId) || this.isMister);
    }
  }
};

window.AttendancePage = AttendancePage;