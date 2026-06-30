const TrainingsPage = {
  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">🏃 Gestione Allenamenti</h2>
      
      <div class="card">
        <div class="card-title">➕ Nuovo Allenamento</div>
        <form id="training-form">
          <div class="form-group">
            <label>📅 Data</label>
            <input type="date" id="tr-date" class="form-control" required />
          </div>
          <div class="form-group">
            <label>⏰ Orario</label>
            <input type="time" id="tr-time" class="form-control" required />
          </div>
          <div class="form-group">
            <label>📍 Luogo</label>
            <input type="text" id="tr-location" class="form-control" placeholder="Es: Campo San Carlo" />
          </div>
          <div class="form-group">
            <label>📝 Note (opzionale)</label>
            <textarea id="tr-notes" class="form-control" rows="2" placeholder="Es: Portare parastinchi"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">💾 Salva Allenamento</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">📋 Allenamenti Programmati</div>
        <div id="trainings-list">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    // Preimposta data di oggi
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tr-date').value = today;

    document.getElementById('training-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        date: document.getElementById('tr-date').value,
        time: document.getElementById('tr-time').value,
        location: document.getElementById('tr-location').value.trim(),
        notes: document.getElementById('tr-notes').value.trim()
      };
      
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Salvataggio...';
      
      try {
        const { error } = await db.from('trainings').insert(data);
        if (error) throw error;
        toast('Allenamento aggiunto! ✅', 'success');
        e.target.reset();
        document.getElementById('tr-date').value = today;
        this.loadTrainings();
      } catch (err) {
        toast('Errore: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '💾 Salva Allenamento';
      }
    });

    await this.loadTrainings();
  },

  async loadTrainings() {
    const container = document.getElementById('trainings-list');
    try {
      const { data, error } = await db
        .from('trainings')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 12px;">Nessun allenamento</p>';
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      
      container.innerHTML = data.map(t => {
        const dateObj = new Date(t.date);
        const isPast = t.date < today;
        return `
          <div class="attendance-row" style="${isPast ? 'opacity: 0.5;' : ''}">
            <div>
              <div style="font-weight: 600; color: var(--granata);">
                ${dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' })}
              </div>
              <div style="font-size: 13px; color: var(--gray-700);">
                ⏰ ${formatTime(t.time)} ${t.location ? '· 📍 ' + t.location : ''}
              </div>
              ${t.notes ? `<div style="font-size: 12px; color: var(--gray-500); margin-top: 2px;">📝 ${t.notes}</div>` : ''}
            </div>
            <button class="icon-btn" onclick="TrainingsPage.deleteTraining('${t.id}')" 
                    style="background: var(--danger); color: var(--white);" title="Elimina">🗑️</button>
          </div>
        `;
      }).join('');
    } catch (err) {
      container.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async deleteTraining(id) {
    if (!confirm('Eliminare questo allenamento?')) return;
    try {
      const { error } = await db.from('trainings').delete().eq('id', id);
      if (error) throw error;
      toast('Allenamento eliminato', 'success');
      this.loadTrainings();
    } catch (err) {
      toast('Errore: ' + err.message, 'error');
    }
  }
};

window.TrainingsPage = TrainingsPage;