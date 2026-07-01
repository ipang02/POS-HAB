// ============================================================
// HAB Barbershop POS — Analytics Module
// ============================================================

const Analytics = {
  charts: {},
  range: 'week',
  trxCache: [],

  init() {
    this.range = 'week';
    document.querySelectorAll('[data-range]').forEach(b => b.classList.toggle('active', b.dataset.range === 'week'));
    this.build();
  },

  build() {
    const trx = this._filterTrx();
    this.trxCache = trx;
    this._renderSummary(trx);
    this._renderBranchComparison();
    this._initCharts(trx);
    this._renderTable(trx);
    this._renderCommissionTable(trx);
  },

  _renderBranchComparison() {
    // Only shown when "All Branches" is selected
    let compEl = document.getElementById('an-branch-compare');
    if (App.currentBranch !== 0) { if (compEl) compEl.remove(); return; }

    const cutoff = new Date();
    if (this.range === 'week') cutoff.setDate(cutoff.getDate() - 6);
    else if (this.range === 'month') cutoff.setDate(1);
    else cutoff.setDate(cutoff.getDate() - 29);
    const cutStr = cutoff.toISOString().split('T')[0];

    const branches = AppData.branches || [];
    const cards = branches.map(b => {
      const bTrx = AppData.transactions.filter(t => t.branchId === b.id && t.date >= cutStr);
      const rev   = bTrx.reduce((s, t) => s + t.total, 0);
      const count = bTrx.length;
      const barbs = AppData.barbers.filter(x => x.branchId === b.id).length;
      return `
        <div class="glass rounded-2xl p-4 flex-1">
          <div class="flex items-center gap-2 mb-3">
            <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
              style="background:rgba(55,65,81,.35)">${b.shortName}</span>
            <p class="text-sm font-bold text-white">${b.name}</p>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-xs"><span class="text-white/45">Revenue</span><span class="font-semibold text-white">${formatRp(rev)}</span></div>
            <div class="flex justify-between text-xs"><span class="text-white/45">Transactions</span><span class="font-semibold text-white">${count}</span></div>
            <div class="flex justify-between text-xs"><span class="text-white/45">Avg. Order</span><span class="font-semibold text-white">${formatRp(count ? rev/count : 0)}</span></div>
            <div class="flex justify-between text-xs"><span class="text-white/45">Barbers</span><span class="font-semibold text-white">${barbs}</span></div>
          </div>
        </div>`;
    }).join('');

    const html = `<div id="an-branch-compare" class="glass rounded-2xl p-5 mb-6">
      <div class="flex items-center gap-2 mb-4">
        <i class="fa-solid fa-code-branch text-sm" style="color:#6B7280"></i>
        <h3 class="text-sm font-bold text-white">Branch Comparison</h3>
        <span class="text-xs text-white/35 ml-1">— ${this.range === 'week' ? 'This week' : this.range === 'month' ? 'This month' : 'Last 30 days'}</span>
      </div>
      <div class="flex gap-4 flex-wrap">${cards}</div>
    </div>`;

    if (compEl) { compEl.outerHTML = html; }
    else {
      const summaryEl = document.querySelector('#an-total-rev')?.closest('.grid');
      if (summaryEl) summaryEl.insertAdjacentHTML('beforebegin', html);
    }
  },

  switchRange(btn) {
    document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.range = btn.dataset.range;
    this.build();
  },

  _filterTrx() {
    const now = new Date();
    let cutoff = new Date();
    if (this.range === 'week') { cutoff.setDate(now.getDate() - 6); }
    else if (this.range === 'month') { cutoff.setDate(1); }
    else { cutoff.setDate(now.getDate() - 29); }
    const cutStr = cutoff.toISOString().split('T')[0];
    return branchTransactions().filter(t => t.date >= cutStr);
  },

  _renderSummary(trx) {
    const rev = trx.reduce((s, t) => s + t.total, 0);
    const avg = trx.length ? rev / trx.length : 0;

    // Top service
    const svcCount = {};
    trx.forEach(t => t.services.forEach(s => { svcCount[s.name] = (svcCount[s.name] || 0) + s.qty; }));
    const topSvc = Object.entries(svcCount).sort((a,b) => b[1]-a[1])[0];

    document.getElementById('an-total-rev').textContent  = formatRp(rev);
    document.getElementById('an-total-trx').textContent  = trx.length;
    document.getElementById('an-avg-order').textContent  = formatRp(avg);
    document.getElementById('an-top-svc').textContent    = topSvc ? topSvc[0] : '—';
    document.getElementById('trx-table-sub').textContent = `${trx.length} transaction${trx.length!==1?'s':''} in range`;
  },

  _initCharts(trx) {
    Chart.defaults.color = '#6B6B6B';
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.borderColor = '#EBEBEB';
    this._revTrendChart(trx);
    this._svcPopChart(trx);
    this._payMethodChart(trx);
    this._barberPerfChart(trx);
  },

  _revTrendChart(trx) {
    const ctx = document.getElementById('chart-rev-trend');
    if (!ctx) return;
    if (this.charts.revTrend) this.charts.revTrend.destroy();

    const dayMap = {};
    trx.forEach(t => { dayMap[t.date] = (dayMap[t.date] || 0) + t.total; });
    const labels = Object.keys(dayMap).sort().slice(-14).map(d => {
      const dt = new Date(d + 'T00:00:00');
      return dt.getDate() + '/' + (dt.getMonth()+1);
    });
    const values = Object.keys(dayMap).sort().slice(-14).map(d => dayMap[d]);

    this.charts.revTrend = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{
        label:'Revenue', data: values,
        borderColor:'#7BAFD4', backgroundColor:'rgba(123,175,212,.15)',
        borderWidth:2.5, fill:true, tension:.4,
        pointBackgroundColor:'#7BAFD4', pointRadius:4, pointHoverRadius:6
      }]},
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#374151', borderColor:'#E8E8E6', borderWidth:1, titleColor:'#FFFFFF', bodyColor:'#DDDDDD', callbacks:{ label: ctx => formatRp(ctx.raw) } }},
        scales:{ x:{grid:{color:'#EBEBEB'},ticks:{color:'#8A8A8A'}}, y:{grid:{color:'#EBEBEB'},ticks:{color:'#8A8A8A',callback:v=>'RM '+v}} }
      }
    });
  },

  _svcPopChart(trx) {
    const ctx = document.getElementById('chart-svc-pop');
    if (!ctx) return;
    if (this.charts.svcPop) this.charts.svcPop.destroy();

    const svcCount = {};
    trx.forEach(t => t.services.forEach(s => { svcCount[s.name] = (svcCount[s.name] || 0) + s.qty; }));
    const sorted = Object.entries(svcCount).sort((a,b) => b[1]-a[1]).slice(0,6);
    const pastels = ['#7BAFD4','#82C09A','#E8A598','#A89CC8','#E8C87A','#6BB8B4'];

    this.charts.svcPop = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(([n]) => n),
        datasets:[{ label:'Bookings', data: sorted.map(([,v]) => v),
          backgroundColor: pastels.map(c => c + 'AA'),
          borderColor: pastels,
          borderWidth:2, borderRadius:8, borderSkipped:false }]
      },
      options:{
        indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#374151', borderColor:'#E8E8E6', borderWidth:1, titleColor:'#FFFFFF', bodyColor:'#DDDDDD' }},
        scales:{ x:{grid:{color:'#EBEBEB'},ticks:{color:'#8A8A8A',stepSize:1}}, y:{grid:{display:false},ticks:{color:'#4A4A4A'}} }
      }
    });
  },

  _payMethodChart(trx) {
    const ctx = document.getElementById('chart-pay-method');
    if (!ctx) return;
    if (this.charts.payMethod) this.charts.payMethod.destroy();

    const cash = trx.filter(t => t.method==='cash').reduce((s,t) => s+t.total, 0);
    const card = trx.filter(t => t.method==='card').reduce((s,t) => s+t.total, 0);
    const qr   = trx.filter(t => t.method==='qr').reduce((s,t) => s+t.total, 0);
    const total = cash + card + qr || 1;

    const legend = document.getElementById('pay-method-legend');
    const colors = ['#7BAFD4','#82C09A','#E8A598'];
    const labels = ['Cash','Card','QR Pay'];
    const values = [cash, card, qr];

    if (legend) {
      legend.innerHTML = labels.map((l,i) => `
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-sm flex-shrink-0" style="background:${colors[i]}"></span>
            <span class="text-xs text-white/55">${l}</span>
          </div>
          <div class="text-right">
            <div class="text-xs font-semibold text-white">${formatRp(values[i])}</div>
            <div class="text-[10px] text-white/30">${Math.round(values[i]/total*100)}%</div>
          </div>
        </div>`).join('');
    }

    this.charts.payMethod = new Chart(ctx, {
      type:'doughnut',
      data:{ labels, datasets:[{ data: values.map(v=>v||0.01), backgroundColor: colors.map(c=>c+'BB'), borderColor: '#FFFFFF', borderWidth:3, hoverOffset:6 }]},
      options:{ responsive:true, maintainAspectRatio:false, cutout:'70%', plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#374151', borderColor:'#E8E8E6', borderWidth:1, titleColor:'#FFFFFF', bodyColor:'#DDDDDD', callbacks:{ label: ctx => formatRp(ctx.raw) } }} }
    });
  },

  _barberPerfChart(trx) {
    const ctx = document.getElementById('chart-barber-perf');
    if (!ctx) return;
    if (this.charts.barberPerf) this.charts.barberPerf.destroy();

    const barberPastels = ['#A89CC8','#6BB8B4','#E8C87A','#E8A598'];
    const barberRevs = branchBarbers().map((b, i) => ({
      name: b.name.split(' ')[0],
      color: barberPastels[i] || '#7BAFD4',
      rev: trx.filter(t => t.barberId == b.id).reduce((s,t) => s+t.total, 0)
    }));

    this.charts.barberPerf = new Chart(ctx, {
      type:'bar',
      data:{
        labels: barberRevs.map(b => b.name),
        datasets:[{ label:'Revenue', data: barberRevs.map(b => b.rev),
          backgroundColor: barberRevs.map(b => b.color + '33'),
          borderColor: barberRevs.map(b => b.color),
          borderWidth:2, borderRadius:8, borderSkipped:false }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#374151', borderColor:'#E8E8E6', borderWidth:1, titleColor:'#FFFFFF', bodyColor:'#DDDDDD', callbacks:{ label: ctx => formatRp(ctx.raw) } }},
        scales:{ x:{grid:{display:false},ticks:{color:'#4A4A4A'}}, y:{grid:{color:'#EBEBEB'},ticks:{color:'#8A8A8A',callback:v=>'RM '+v}} }
      }
    });
  },

  _renderTable(trx) {
    const tbody = document.getElementById('all-trx-tbody');
    if (!tbody) return;
    const sorted = [...trx].sort((a,b) => (b.date+b.time).localeCompare(a.date+a.time));

    tbody.innerHTML = sorted.map(t => {
      const barber   = getBarberById(t.barberId);
      const svcNames = t.services.map(s => s.name).join(', ');
      return `
        <tr class="hover:bg-white/2 transition-colors">
          <td class="py-2.5 pr-4 text-xs font-mono text-white/50">${t.id}</td>
          <td class="py-2.5 pr-4 text-sm text-white font-medium">${t.customer}</td>
          <td class="py-2.5 pr-4 text-xs text-white/50 hidden md:table-cell max-w-[150px] truncate">${svcNames}</td>
          <td class="py-2.5 pr-4 text-sm text-white/55 hidden md:table-cell">${barber ? barber.name.split(' ')[0] : '—'}</td>
          <td class="py-2.5 pr-4 hidden sm:table-cell">
            <span class="flex items-center gap-1.5 text-xs text-white/55">
              <i class="fa-solid ${methodIcon(t.method)} text-gold text-[10px]"></i>${methodLabel(t.method)}
            </span>
          </td>
          <td class="py-2.5 pr-4 text-xs text-white/40 hidden lg:table-cell">${t.date} ${t.time}</td>
          <td class="py-2.5 text-right text-sm font-semibold text-white">${formatRp(t.total)}</td>
        </tr>`;
    }).join('') || `<tr><td colspan="7" class="text-center py-8 text-white/25 text-sm">No transactions in this range</td></tr>`;
  },

  _renderCommissionTable(trx) {
    const wrap = document.getElementById('an-commission-wrap');
    const tbody = document.getElementById('an-commission-tbody');
    if (!tbody) return;

    const barberMap = {};
    trx.forEach(t => {
      (t.services || []).forEach(s => {
        if (s.type !== 'product' || !s.commissionRM) return;
        if (!barberMap[t.barberId]) barberMap[t.barberId] = { sold: 0, revenue: 0, commission: 0 };
        barberMap[t.barberId].sold       += (s.qty || 1);
        barberMap[t.barberId].revenue    += (s.price || 0) * (s.qty || 1);
        barberMap[t.barberId].commission += s.commissionRM * (s.qty || 1);
      });
    });

    const entries = Object.entries(barberMap);
    if (wrap) wrap.classList.toggle('hidden', entries.length === 0);

    tbody.innerHTML = entries.length ? entries.map(([barberId, d]) => {
      const b = getBarberById(parseInt(barberId));
      return `<tr class="hover:bg-white/2 transition-colors border-b border-white/5 last:border-0">
        <td class="py-2.5 pr-4">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style="background:${b?.color || '#374151'}33;border:1px solid ${b?.color || '#374151'}44">${b?.initials || '?'}</div>
            <span class="text-sm text-white">${b?.name || 'Unknown'}</span>
          </div>
        </td>
        <td class="py-2.5 pr-4 text-sm text-white/60">${d.sold} unit${d.sold !== 1 ? 's' : ''}</td>
        <td class="py-2.5 pr-4 text-sm text-white">${formatRp(d.revenue)}</td>
        <td class="py-2.5 text-right text-sm font-bold text-green-400">${formatRp(d.commission)}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="4" class="py-6 text-center text-xs text-white/30">No product commissions recorded in this period</td></tr>`;
  },

  filterTrx() {
    const q = (document.getElementById('trx-search')?.value || '').toLowerCase();
    const trx = this.trxCache.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.customer.toLowerCase().includes(q) ||
      t.services.some(s => s.name.toLowerCase().includes(q))
    );
    this._renderTable(trx);
  },

  exportCSV() {
    const trx = this._filterTrx();
    const rows = [['ID','Customer','Services','Barber','Method','Total','Date','Time']];
    trx.forEach(t => {
      const barber = getBarberById(t.barberId);
      rows.push([
        t.id, t.customer,
        t.services.map(s => s.name + 'x' + s.qty).join('; '),
        barber ? barber.name : '',
        methodLabel(t.method),
        t.total, t.date, t.time
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `HAB-transactions-${today()}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('CSV exported successfully!', 'success');
  }
};
