const RosterPage = {
  filterRole: 'all',

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">👥 Gestione Rosa</h2>

      <!-- Statistiche rapide -->
      <div id="roster-stats" class="card" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
        <div class="spinner" style="grid-column: 1 / -1;"></div>
      </div>

      <!-- Form aggiunta -->
      <div class="card">
        <div class="card-title">➕ Aggiungi Giocatore</div>
        <form id="player-form">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label>Nome *</label>
              <input type="text" id="pl-first" class="form-control" placeholder="Mario" required />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label>Cognome *</label>
              <input type="text" id="pl-last" class="form-control" placeholder="Rossi" required />
            </div>
          </div>
          <div class="form-group">
            <label>📅 Data di nascita</label>
            <input type="date" id="pl-birth" class="form-control" />
          </div>
          <div class="form-group">
            <label>⚽ Ruolo</label>
            <select id="pl-role" class="form-control">
              <option value="">-- Seleziona --</option>
              <option value="portiere">🧤 Portiere</option>
              <option value="difensore">🛡️ Difensore</option>
              <option value="centrocampista">⚡ Centrocampista</option>
              <option value="attaccante">🎯 Attaccante</option>
            </select>
          </div>

          <div style="background: var(--gray-50); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
              <input type="checkbox" id="pl-medical" style="width: 18px; height: 18px; accent-color: var(--granata);" />
              🩺 Certificato medico presente
            </label>
            <div id="medical-expiry-section" class="hidden" style="margin-top: 10px;">
              <label style="font-size: 13px;">📅 Scadenza certificato</label>
              <input type="date" id="pl-medical-expiry" class="form-control" />
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block">➕ Aggiungi Giocatore</button>
        </form>
      </div>

      <!-- Filtro -->
      <div class="card">
        <div class="card-title">📋 Rosa Giocatori</div>
        <div class="role-tabs" style="margin-bottom: 12px;">
          <button class="role-tab active" data-filter="all">Tutti</button>
          <button class="role-tab" data-filter="portiere">🧤</button>
          <button class="role-tab" data-filter="difensore">🛡️</button>
          <button class="role-tab" data-filter="centrocampista">⚡</button>
          <button class="role-tab" data-filter="attaccante">🎯</button>
        </div>
        <div id="players-list">
          <div class="spinner"></div>
        </div>
      </div>

      <!-- Modale modifica -->
      <div id="edit-modal" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px;">
        <div class="card" style="max-width: 450px; width: 100%; max-height: 90vh; overflow-y: auto;">
          <div class="flex-between mb-4">
            <h3 style="color: var(--granata);">✏️ Modifica Giocatore</h3>
            <button class="icon-btn" id="close-edit-modal" style="background: var(--gray-200); color: var(--gray-700);">✕</button>
          </div>
          <form id="edit-form">
            <input type="hidden" id="edit-id" />
            <div class="form-group">
              <label>Nome *</label>
              <input type="text" id="edit-first" class="form-control" required />
            </div>
            <div class="form-group">
              <label>Cognome *</label>
              <input type="text" id="edit-last" class="form-control" required />
            </div>
            <div class="form-group">
              <label>📅 Data di nascita</label>
              <input type="date" id="edit-birth" class="form-control" />
            </div>
            <div class="form-group">
              <label>⚽ Ruolo</label>
              <select id="edit-role" class="form-control">
                <option value="">-- Seleziona --</option>
                <option value="portiere">🧤 Portiere</option>
                <option value="difensore">🛡️ Difensore</option>
                <option value="centrocampista">⚡ Centrocampista</option>
                <option value="attaccante">🎯 Attaccante</option>
              </select>
            </div>
            <div style="background: var(--gray-50); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                <input type="checkbox" id="edit-medical" style="width: 18px; height: 18px; accent-color: var(--granata);" />
                🩺 Certificato medico presente
              </label>
              <div id="edit-medical-expiry-section" class="hidden" style="margin-top: 10px;">
                <label style="font-size: 13px;">📅 Scadenza certificato</label>
                <input type="date" id="edit-medical-expiry" class="form-control" />
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">💾 Salva Modifiche</button>
          </form>
        </div>
      </div>
    `;

    // Toggle sezione scadenza certificato
    const medicalCheckbox = document.getElementById('pl-medical');
    const medicalSection = document.getElementById('medical-expiry-section');
    medicalCheckbox.addEventListener('change', () => {
      medicalSection.classList.toggle('hidden', !medicalCheckbox.checked);
    });

    const editMedicalCheckbox = document.getElementById('edit-medical');
    const editMedicalSection = document.getElementById('edit-medical-expiry-section');
    editMedicalCheckbox.addEventListener('change', () => {
      editMedicalSection.classList.toggle('hidden', !editMedicalCheckbox.checked);
    });

    // Filtro ruolo
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filterRole = btn.dataset.filter;
        this.loadPlayers();
      });
    });

    // Submit nuovo giocatore
    document.getElementById('player-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.addPlayer();
    });

    // Modale close
    document.getElementById('close-edit-modal').addEventListener('click', () => {
      document.getElementById('edit-modal').classList.add('hidden');
    });

    // Submit modifica
    document.getElementById('edit-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.updatePlayer();
    });

    await this.loadStats();
    await this.loadPlayers();
  },

  async loadStats() {
    const container = document.getElementById('roster-stats');
    try {
      const { data, error } = await db.from('players').select('id, role');
      if (error) throw error;

      const total = data?.length || 0;
      const byRole = { portiere: 0, difensore: 0, centrocampista: 0, attaccante: 0, altro: 0 };
      data?.forEach(p => {
        if (byRole[p.role] !== undefined) byRole[p.role]++;
        else byRole.altro++;
      });

      container.innerHTML = `
        <div style="text-align: center; padding: 8px; background: rgba(122,31,46,0.05); border-radius: 8px;">
          <div style="font-size: 22px; font-weight: 700; color: var(--granata);">${total}</div>
          <div style="font-size: 11px; color: var(--gray-500);">TOTALE</div>
        </div>
        <div style="text-align: center; padding: 8px; background: var(--gray-50); border-radius: 8px;">
          <div style="font-size: 13px; font-weight: 600;">
            🧤 ${byRole.portiere} · 🛡️ ${byRole.difensore}<br>
            ⚡ ${byRole.campista} · 🎯 ${byRole.attaccante}
          </div>
          <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">PER RUOLO</div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger); grid-column: 1/-1;">Errore: ${err.message}</p>`;
    }
  },

  async loadPlayers() {
    const container = document.getElementById('players-list');
    container.innerHTML = '<div class="spinner"></div>';

    try {
      let query = db
        .from('players')
        .select(`
          *,
          parent:profiles!players_parent_id_fkey(full_name, email)
        `)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (this.filterRole !== 'all') {
        query = query.eq('role', this.filterRole);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        container.innerHTML = `
          <p style="color: var(--gray-500); text-align: center; padding: 20px;">
            📭 Nessun giocatore${this.filterRole !== 'all' ? ' con questo ruolo' : ''}
          </p>
        `;
        return;
      }

      const roleEmoji = {
        'portiere': '🧤',
        'difensore': '🛡️',
        'centrocampista': '⚡',
        'attaccante': '🎯'
      };

      const today = new Date().toISOString().split('T')[0];

      container.innerHTML = data.map(p => {
        const emoji = roleEmoji[p.role] || '⚽';
        const roleName = p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : 'N.D.';

        // Calcola età
        let age = '';
        if (p.birth_date) {
          const birth = new Date(p.birth_date);
          const ageNum = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
          age = `${ageNum} anni`;
        }

        // Stato certificato medico
        let medicalBadge = '';
        if (p.medical_certificate) {
          if (p.medical_expiry && p.medical_expiry < today) {
            medicalBadge = `<span class="badge badge-danger">🩺 Scaduto</span>`;
          } else if (p.medical_expiry) {
            const daysUntil = Math.ceil((new Date(p.medical_expiry) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 30) {
              medicalBadge = `<span class="badge badge-warning">🩺 Scade tra ${daysUntil}g</span>`;
            } else {
              medicalBadge = `<span class="badge badge-success">🩺 OK</span>`;
            }
          } else {
            medicalBadge = `<span class="badge badge-success">🩺 Presente</span>`;
          }
        } else {
          medicalBadge = `<span class="badge" style="background: var(--gray-200); color: var(--gray-700);">🩺 Mancante</span>`;
        }

// ✅ Genitori collegati (ENTRAMBI se presenti)
     const parent1Name = p.parent?.full_name || p.parent?.email || '';
     const parent2Name = p.parent2?.full_name || p.parent2?.email || '';
     const parentsHtml = (parent1Name || parent2Name)
       ? `<div style="font-size: 11px; color: var(--gray-500); margin-top: 2px;">👨‍‍👦 ${parent1Name}${parent1Name && parent2Name ? ' · ' : ''}${parent2Name}</div>`
       : '';
     const hasParent = !!(p.parent || p.parent2);
     return `
       <div class="card" style="margin-bottom: 8px; padding: 12px;">
         <div style="display: flex; justify-content: space-between; align-items: flex-start;">
           <div style="flex: 1;">
             <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
               <strong style="font-size: 15px; color: var(--gray-900);">
                 ${emoji} ${p.last_name} ${p.first_name}
               </strong>
               <span class="badge badge-granata">${roleName}</span>
               ${medicalBadge}
             </div>
             ${age ? `<div style="font-size: 12px; color: var(--gray-500); margin-top: 2px;">🎂 ${age}${p.birth_date ? ' (' + formatDate(p.birth_date) + ')' : ''}</div>` : ''}
             ${parentsHtml}
           </div>
           <div style="display: flex; gap: 6px;">
             <button class="icon-btn" onclick="RosterPage.openEditModal('${p.id}')" 
                     style="background: var(--granata); color: var(--white); width: 32px; height: 32px; font-size: 14px;" 
                     title="Modifica">️</button>
             <button class="icon-btn" onclick="RosterPage.deletePlayer('${p.id}', '${p.last_name} ${p.first_name}', ${hasParent})" 
                     style="background: var(--danger); color: var(--white); width: 32px; height: 32px; font-size: 14px;" 
                     title="Elimina">🗑️</button>
           </div>
         </div>
       </div>
     `;
   }).join('');
 } catch (err) {
   container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
 }
},

  async addPlayer() {
    const first = document.getElementById('pl-first').value.trim();
    const last = document.getElementById('pl-last').value.trim();
    const birth = document.getElementById('pl-birth').value || null;
    const role = document.getElementById('pl-role').value || null;
    const medical = document.getElementById('pl-medical').checked;
    const medicalExpiry = document.getElementById('pl-medical-expiry').value || null;

    const btn = document.querySelector('#player-form button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvataggio...';

    try {
      const { error } = await db.from('players').insert({
        first_name: first,
        last_name: last,
        birth_date: birth,
        role: role,
        medical_certificate: medical,
        medical_expiry: medical ? medicalExpiry : null
      });

      if (error) throw error;

      toast('Giocatore aggiunto! ✅', 'success');
      document.getElementById('player-form').reset();
      document.getElementById('medical-expiry-section').classList.add('hidden');
      await this.loadPlayers();
      await this.loadStats();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '➕ Aggiungi Giocatore';
    }
  },

  async openEditModal(playerId) {
    try {
      const { data: player, error } = await db
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      if (!player) return;

      document.getElementById('edit-id').value = player.id;
      document.getElementById('edit-first').value = player.first_name;
      document.getElementById('edit-last').value = player.last_name;
      document.getElementById('edit-birth').value = player.birth_date || '';
      document.getElementById('edit-role').value = player.role || '';
      document.getElementById('edit-medical').checked = !!player.medical_certificate;
      document.getElementById('edit-medical-expiry').value = player.medical_expiry || '';
      
      const section = document.getElementById('edit-medical-expiry-section');
      section.classList.toggle('hidden', !player.medical_certificate);

      document.getElementById('edit-modal').classList.remove('hidden');
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  },

  async updatePlayer() {
    const id = document.getElementById('edit-id').value;
    const medical = document.getElementById('edit-medical').checked;
    
    const data = {
      first_name: document.getElementById('edit-first').value.trim(),
      last_name: document.getElementById('edit-last').value.trim(),
      birth_date: document.getElementById('edit-birth').value || null,
      role: document.getElementById('edit-role').value || null,
      medical_certificate: medical,
      medical_expiry: medical ? (document.getElementById('edit-medical-expiry').value || null) : null
    };

    const btn = document.querySelector('#edit-form button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Salvataggio...';

    try {
      const { error } = await db.from('players').update(data).eq('id', id);
      if (error) throw error;

      toast('Giocatore aggiornato! ✅', 'success');
      document.getElementById('edit-modal').classList.add('hidden');
      await this.loadPlayers();
      await this.loadStats();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Salva Modifiche';
    }
  },

  async deletePlayer(id, name, hasParent) {
    let message = `Eliminare ${name} dalla rosa?`;
    if (hasParent) {
      message += `\n\n⚠️ ATTENZIONE: questo giocatore è collegato a un genitore. L'account del genitore perderà il collegamento.`;
    }
    
    if (!confirm(message)) return;

    try {
      // Se ha un genitore, prima scollega
      if (hasParent) {
        await db.from('players').update({ parent_id: null }).eq('id', id);
      }
      
      const { error } = await db.from('players').delete().eq('id', id);
      if (error) throw error;

      toast('Giocatore eliminato', 'success');
      await this.loadPlayers();
      await this.loadStats();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  }
};

window.RosterPage = RosterPage;