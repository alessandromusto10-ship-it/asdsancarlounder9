const StatsPage = {
  periodFilter: 'month',
  customFrom: null,
  customTo: null,

  async render() {
    const view = document.getElementById('view');
    view.innerHTML = `
      <h2 style="color: var(--granata); margin-bottom: 16px;">📊 Statistiche Presenze</h2>

      <!-- Statistiche Globali -->
      <div id="global-stats" class="card" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
        <div class="spinner" style="grid-column: 1 / -1;"></div>
      </div>

      <!-- Filtri Periodo -->
      <div class="card">
        <div class="card-title">🔍 Filtra per Periodo</div>
        <div class="role-tabs" style="margin-bottom: 12px;">
          <button class="role-tab active" data-period="month">Mese</button>
          <button class="role-tab" data-period="3months">3 Mesi</button>
          <button class="role-tab" data-period="season">Stagione</button>
          <button class="role-tab" data-period="custom">Personalizzato</button>
        </div>
        <div id="custom-dates" class="hidden" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label>📅 Da</label>
            <input type="date" id="filter-from" class="form-control" />
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>📅 A</label>
            <input type="date" id="filter-to" class="form-control" />
          </div>
        </div>
        <button id="btn-apply-filter" class="btn btn-primary btn-block mt-2">Applica Filtro</button>
      </div>

      <!-- Tabella Presenze -->
      <div class="card">
        <div class="flex-between mb-4">
          <div class="card-title" style="margin-bottom: 0;">📋 Presenze Giocatori</div>
          <button id="btn-export-pdf" class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;">
            📄 Esporta PDF
          </button>
        </div>
        <div id="stats-table">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    // Filtri periodo
    document.querySelectorAll('[data-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-period]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.periodFilter = btn.dataset.period;
        
        const customDates = document.getElementById('custom-dates');
        if (this.periodFilter === 'custom') {
          customDates.classList.remove('hidden');
        } else {
          customDates.classList.add('hidden');
        }
      });
    });

    // Applica filtro
    document.getElementById('btn-apply-filter').addEventListener('click', () => {
      if (this.periodFilter === 'custom') {
        this.customFrom = document.getElementById('filter-from').value;
        this.customTo = document.getElementById('filter-to').value;
        if (!this.customFrom || !this.customTo) {
          toast('Seleziona entrambe le date', 'error');
          return;
        }
      }
      this.loadStats();
    });

    // Export PDF
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
      this.exportPDF();
    });

    // Imposta date di default per filtro custom
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('filter-from').value = monthStart.toISOString().split('T')[0];
    document.getElementById('filter-to').value = today.toISOString().split('T')[0];

    await this.loadStats();
  },

  getDateRange() {
    const today = new Date();
    let from, to;

    switch (this.periodFilter) {
      case 'month':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = today;
        break;
      case '3months':
        from = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        to = today;
        break;
      case 'season':
        // Stagione: settembre anno precedente - giugno anno corrente
        const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
        from = new Date(year, 8, 1); // Settembre
        to = new Date(year + 1, 5, 30); // Giugno
        break;
      case 'custom':
        from = new Date(this.customFrom);
        to = new Date(this.customTo);
        break;
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };
  },

  async loadStats() {
    const globalContainer = document.getElementById('global-stats');
    const tableContainer = document.getElementById('stats-table');
    
    globalContainer.innerHTML = '<div class="spinner" style="grid-column: 1 / -1;"></div>';
    tableContainer.innerHTML = '<div class="spinner"></div>';

    try {
      const { from, to } = this.getDateRange();

      // Carica allenamenti nel periodo
      const { data: trainings, error: tErr } = await db
        .from('trainings')
        .select('id, date')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });

      if (tErr) throw tErr;

      const totalTrainings = trainings?.length || 0;

      if (totalTrainings === 0) {
        globalContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--gray-500);">
            📭 Nessun allenamento nel periodo selezionato
          </div>
        `;
        tableContainer.innerHTML = `
          <p style="color: var(--gray-500); text-align: center; padding: 20px;">
            Nessun dato disponibile
          </p>
        `;
        return;
      }

      // Carica tutti i giocatori
      const { data: players, error: pErr } = await db
        .from('players')
        .select('id, first_name, last_name, role')
        .order('last_name')
        .order('first_name');

      if (pErr) throw pErr;

      const totalPlayers = players?.length || 0;

      // Carica tutte le presenze nel periodo
      const trainingIds = trainings.map(t => t.id);
      const { data: attendances, error: aErr } = await db
        .from('attendances')
        .select('player_id, status')
        .in('training_id', trainingIds);

      if (aErr) throw aErr;

      // Calcola statistiche per giocatore
      const playerStats = {};
      players?.forEach(p => {
        playerStats[p.id] = {
          id: p.id,
          name: `${p.last_name} ${p.first_name}`,
          role: p.role,
          presente: 0,
          assente: 0,
          giustificato: 0
        };
      });

      attendances?.forEach(a => {
        if (playerStats[a.player_id]) {
          playerStats[a.player_id][a.status]++;
        }
      });

      // Calcola media presenze globale
      let totalPresent = 0;
      Object.values(playerStats).forEach(ps => {
        totalPresent += ps.presente + ps.giustificato;
      });
      const avgAttendance = totalPlayers > 0 
        ? Math.round((totalPresent / (totalPlayers * totalTrainings)) * 100) 
        : 0;

      // Giocatori con >75% presenze
      const highAttendance = Object.values(playerStats).filter(ps => {
        const total = ps.presente + ps.assente + ps.giustificato;
        const pct = total > 0 ? ((ps.presente + ps.giustificato) / total) * 100 : 0;
        return pct >= 75;
      }).length;

      // Render statistiche globali
      globalContainer.innerHTML = `
        <div style="text-align: center; padding: 12px; background: rgba(122,31,46,0.05); border-radius: 8px;">
          <div style="font-size: 28px; font-weight: 700; color: var(--granata);">${totalTrainings}</div>
          <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">ALLENAMENTI</div>
        </div>
        <div style="text-align: center; padding: 12px; background: rgba(22,163,74,0.08); border-radius: 8px;">
          <div style="font-size: 28px; font-weight: 700; color: var(--success);">${avgAttendance}%</div>
          <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">MEDIA PRESENZE</div>
        </div>
        <div style="text-align: center; padding: 12px; background: rgba(245,158,11,0.08); border-radius: 8px;">
          <div style="font-size: 28px; font-weight: 700; color: var(--warning);">${highAttendance}</div>
          <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">>75% PRESENZE</div>
        </div>
      `;

      // Render tabella
      const roleEmoji = {
        'portiere': '🧤',
        'difensore': '🛡️',
        'centrocampista': '⚡',
        'attaccante': '🎯'
      };

      let html = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Giocatore</th>
                <th style="text-align: center; color: #4ade80;">✅</th>
                <th style="text-align: center; color: #f87171;">❌</th>
                <th style="text-align: center; color: #fbbf24;">⚠️</th>
                <th style="text-align: center; width: 100px;">%</th>
              </tr>
            </thead>
            <tbody>
      `;

      Object.values(playerStats)
        .sort((a, b) => {
          const pctA = (a.presente + a.assente + a.giustificato) > 0 
            ? (a.presente + a.giustificato) / (a.presente + a.assente + a.giustificato) 
            : 0;
          const pctB = (b.presente + b.assente + b.giustificato) > 0 
            ? (b.presente + b.giustificato) / (b.presente + b.assente + b.giustificato) 
            : 0;
          return pctB - pctA;
        })
        .forEach(ps => {
          const total = ps.presente + ps.assente + ps.giustificato;
          const pct = total > 0 ? Math.round(((ps.presente + ps.giustificato) / total) * 100) : 0;
          const emoji = roleEmoji[ps.role] || '⚽';
          
          let barColor = 'var(--danger)';
          if (pct >= 75) barColor = 'var(--success)';
          else if (pct >= 50) barColor = 'var(--warning)';

          html += `
            <tr>
              <td>
                <div style="font-weight: 600; font-size: 13px;">${emoji} ${ps.name}</div>
              </td>
              <td style="text-align: center; color: var(--success); font-weight: 600;">${ps.presente}</td>
              <td style="text-align: center; color: var(--danger); font-weight: 600;">${ps.assente}</td>
              <td style="text-align: center; color: var(--warning); font-weight: 600;">${ps.giustificato}</td>
              <td style="text-align: center;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="flex: 1; height: 8px; background: var(--gray-200); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${pct}%; height: 100%; background: ${barColor}; transition: width 0.3s;"></div>
                  </div>
                  <span style="font-size: 12px; font-weight: 600; min-width: 35px;">${pct}%</span>
                </div>
              </td>
            </tr>
          `;
        });

      html += `
            </tbody>
          </table>
        </div>
      `;

      tableContainer.innerHTML = html;

      // Salva dati per export PDF
      this.statsData = {
        trainings: totalTrainings,
        players: totalPlayers,
        avgAttendance,
        highAttendance,
        playerStats: Object.values(playerStats),
        from,
        to
      };

    } catch (err) {
      globalContainer.innerHTML = `<p style="color: var(--danger); grid-column: 1/-1;">Errore: ${err.message}</p>`;
      tableContainer.innerHTML = `<p style="color: var(--danger);">Errore: ${err.message}</p>`;
    }
  },

  async exportPDF() {
    if (!this.statsData) {
      toast('Nessun dato da esportare', 'error');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const { trainings, players, avgAttendance, highAttendance, playerStats, from, to } = this.statsData;

      // Intestazione
      doc.setFillColor(122, 31, 46); // Granata
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('ASD San Carlo Milano', 105, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text('Statistiche Presenze Under 9', 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      const fromDate = new Date(from).toLocaleDateString('it-IT');
      const toDate = new Date(to).toLocaleDateString('it-IT');
      doc.text(`Periodo: ${fromDate} - ${toDate}`, 105, 33, { align: 'center' });

      // Statistiche globali
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Statistiche Globali', 14, 50);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Totale Allenamenti: ${trainings}`, 14, 58);
      doc.text(`Totale Giocatori: ${players}`, 14, 64);
      doc.text(`Media Presenze: ${avgAttendance}%`, 14, 70);
      doc.text(`Giocatori con >75% presenze: ${highAttendance}`, 14, 76);

      // Tabella presenze
      const tableData = playerStats.map(ps => {
        const total = ps.presente + ps.assente + ps.giustificato;
        const pct = total > 0 ? Math.round(((ps.presente + ps.giustificato) / total) * 100) : 0;
        return [
          ps.name,
          ps.presente.toString(),
          ps.assente.toString(),
          ps.giustificato.toString(),
          `${pct}%`
        ];
      });

      doc.autoTable({
        startY: 85,
        head: [['Giocatore', 'Presenze', 'Assenze', 'Giust.', '%']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [122, 31, 46],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        margin: { top: 85 }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')} - Pagina ${i} di ${pageCount}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // Salva PDF
      const filename = `Statistiche_Presenze_${from}_to_${to}.pdf`;
      doc.save(filename);
      
      toast('PDF esportato con successo! 📄', 'success');

    } catch (err) {
      console.error('Errore export PDF:', err);
      toast('Errore durante l\'export: ' + err.message, 'error');
    }
  }
};

window.StatsPage = StatsPage;