// ============================================================
// HAB Barbershop POS — Monthly Report
// ============================================================

const MonthlyReport = {
  _unlocked: false,

  init() {
    if (this._unlocked) {
      this._showContent();
    } else {
      document.getElementById('mr-locked').classList.remove('hidden');
      document.getElementById('mr-content').classList.add('hidden');
    }
  },

  unlock() {
    SessionManager.requireOwnerPin(() => {
      this._unlocked = true;
      this._showContent();
    });
  },

  _showContent() {
    document.getElementById('mr-locked').classList.add('hidden');
    document.getElementById('mr-content').classList.remove('hidden');
    this._populatePickers();
    this.render();
  },

  _populatePickers() {
    const monthSel = document.getElementById('mr-month');
    const yearSel  = document.getElementById('mr-year');
    if (monthSel.options.length) return; // already populated

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    monthNames.forEach((m, i) => {
      const o = document.createElement('option');
      o.value = String(i + 1).padStart(2, '0');
      o.textContent = m;
      monthSel.appendChild(o);
    });

    const now = new Date();
    for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) {
      const o = document.createElement('option');
      o.value = y;
      o.textContent = y;
      yearSel.appendChild(o);
    }
    monthSel.value = String(now.getMonth() + 1).padStart(2, '0');
    yearSel.value  = now.getFullYear();
  },

  render() {
    const month  = document.getElementById('mr-month').value;
    const year   = document.getElementById('mr-year').value;
    const prefix = `${year}-${month}`;
    const trx    = branchTransactions().filter(t => t.date?.startsWith(prefix));

    const totalRev  = trx.reduce((s, t) => s + (t.total || 0), 0);
    const totalPax  = trx.reduce((s, t) => s + (t.paxCount || 1), 0);
    const daysInMo  = new Date(parseInt(year), parseInt(month), 0).getDate();
    const avgPerDay = daysInMo ? Math.round(totalRev / daysInMo) : 0;

    const monthNames = ['','January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    document.getElementById('mr-subtitle').textContent =
      `${monthNames[parseInt(month)]} ${year} · ${currentBranchName()}`;

    // Summary cards
    document.getElementById('mr-summary-cards').innerHTML = `
      <div class="glass rounded-2xl p-4">
        <div class="text-[10px] text-white/35 uppercase tracking-wide mb-1">Total Revenue</div>
        <div class="text-xl font-bold gold-text">${formatRp(totalRev)}</div>
        <div class="text-xs text-white/35 mt-0.5">${trx.length} transactions</div>
      </div>
      <div class="glass rounded-2xl p-4">
        <div class="text-[10px] text-white/35 uppercase tracking-wide mb-1">Total Pax</div>
        <div class="text-xl font-bold text-white">${totalPax}</div>
        <div class="text-xs text-white/35 mt-0.5">customers served</div>
      </div>
      <div class="glass rounded-2xl p-4">
        <div class="text-[10px] text-white/35 uppercase tracking-wide mb-1">Avg / Day</div>
        <div class="text-xl font-bold text-white">${formatRp(avgPerDay)}</div>
        <div class="text-xs text-white/35 mt-0.5">daily revenue</div>
      </div>
      <div class="glass rounded-2xl p-4">
        <div class="text-[10px] text-white/35 uppercase tracking-wide mb-1">Avg / Pax</div>
        <div class="text-xl font-bold text-white">${totalPax ? formatRp(Math.round(totalRev / totalPax)) : formatRp(0)}</div>
        <div class="text-xs text-white/35 mt-0.5">revenue per person</div>
      </div>`;

    this._renderBarberTable(trx);
    this._renderServicesTable(trx);
  },

  _renderBarberTable(trx) {
    const tbody   = document.getElementById('mr-barber-tbody');
    const barbers = branchBarbers();
    const map     = {};
    barbers.forEach(b => { map[b.id] = { b, rev: 0, pax: 0, count: 0 }; });

    trx.forEach(t => {
      (t.services || []).forEach(sv => {
        const bid = sv.barberId || t.barberId || 0;
        if (map[bid]) map[bid].rev += (sv.price || 0) * (sv.qty || 1);
      });
      const pid = t.barberId || 0;
      if (map[pid]) { map[pid].pax += (t.paxCount || 1); map[pid].count++; }
    });

    const rows = Object.values(map).filter(r => r.rev > 0 || r.count > 0);
    rows.sort((a, b) => b.rev - a.rev);

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-sm text-white/30">No transactions this month</td></tr>`;
      return;
    }

    const totRev  = rows.reduce((s, r) => s + r.rev, 0);
    const totComm = rows.reduce((s, r) => s + Math.round(r.rev * r.b.commission / 100), 0);
    const totPax  = rows.reduce((s, r) => s + r.pax, 0);
    const totCnt  = rows.reduce((s, r) => s + r.count, 0);

    tbody.innerHTML = rows.map(({ b, rev, pax, count }) => {
      const comm = Math.round(rev * b.commission / 100);
      return `
        <tr class="hover:bg-white/2 transition-colors">
          <td class="py-2.5 pr-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style="background:${b.color}33;border:1px solid ${b.color}44">${b.initials}</div>
              <span class="font-semibold text-white">${b.name}</span>
            </div>
          </td>
          <td class="py-2.5 pr-4 text-white/60">${count}</td>
          <td class="py-2.5 pr-4 text-white/60">${pax}</td>
          <td class="py-2.5 pr-4 font-semibold text-white">${formatRp(rev)}</td>
          <td class="py-2.5 pr-4 text-white/45 hidden sm:table-cell">${b.commission}%</td>
          <td class="py-2.5 text-right font-semibold text-green-400">${formatRp(comm)}</td>
        </tr>`;
    }).join('') + `
      <tr class="border-t-2 border-white/10 font-bold">
        <td class="py-2.5 pr-4 text-white">Total</td>
        <td class="py-2.5 pr-4 text-white">${totCnt}</td>
        <td class="py-2.5 pr-4 text-white">${totPax}</td>
        <td class="py-2.5 pr-4 gold-text">${formatRp(totRev)}</td>
        <td class="py-2.5 pr-4 hidden sm:table-cell"></td>
        <td class="py-2.5 text-right text-green-400">${formatRp(totComm)}</td>
      </tr>`;
  },

  _renderServicesTable(trx) {
    const tbody  = document.getElementById('mr-services-tbody');
    const svcMap = {};

    trx.forEach(t => {
      (t.services || []).forEach(sv => {
        const key = sv.name || String(sv.id) || 'Unknown';
        if (!svcMap[key]) svcMap[key] = { name: key, count: 0, rev: 0 };
        svcMap[key].count += (sv.qty || 1);
        svcMap[key].rev   += (sv.price || 0) * (sv.qty || 1);
      });
    });

    const rows = Object.values(svcMap).sort((a, b) => b.rev - a.rev).slice(0, 10);

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="py-8 text-center text-sm text-white/30">No services this month</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((s, i) => `
      <tr class="hover:bg-white/2 transition-colors">
        <td class="py-2.5 pr-4">
          <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mr-2
            ${i === 0 ? 'bg-amber-400/18 text-amber-400' : 'bg-white/7 text-white/38'}">${i + 1}</span>
          <span class="font-medium text-white">${s.name}</span>
        </td>
        <td class="py-2.5 pr-4 text-white/55">${s.count}×</td>
        <td class="py-2.5 text-right font-semibold text-white">${formatRp(s.rev)}</td>
      </tr>`).join('');
  }
};
