// ============================================================
// HAB Barbershop POS — Dashboard Module
// ============================================================

const Dashboard = {
  charts: {},

  init() {
    this.renderKPIs();
    this.renderRecentTrx();
    this.renderQueue();
    this.initCharts();
  },

  renderKPIs() {
    const trx   = todayTransactions();
    const revenue    = trx.reduce((s, t) => s + (t.total || 0), 0);
    const customers  = new Set(trx.filter(t => t.customer !== 'Walk-in').map(t => t.customer)).size + trx.filter(t => t.customer === 'Walk-in').length;
    const activeBarb = branchBarbers().filter(b => b.status === 'available' || b.status === 'busy').length;
    const pendingApt = branchAppointments().filter(a => a.status === 'pending').length;

    this._animCount('kpi-revenue',       formatRp(revenue));
    this._animCount('kpi-customers',     customers);
    this._animCount('kpi-barbers',       activeBarb);
    this._animCount('kpi-barbers-total', branchBarbers().length);
    this._animCount('kpi-appts',         pendingApt);

    // Update appointment badge in sidebar
    const badge = document.getElementById('nav-appt-badge');
    if (badge) { badge.textContent = pendingApt; badge.classList.toggle('hidden', pendingApt === 0); }
  },

  _animCount(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('anim-count-up');
    el.textContent = val;
    el.addEventListener('animationend', () => el.classList.remove('anim-count-up'), { once: true });
  },

  renderRecentTrx() {
    const tbody = document.getElementById('recent-trx-tbody');
    if (!tbody) return;
    const trx = [...AppData.transactions].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 8);

    if (!trx.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-white/25 text-sm">No transactions yet</td></tr>`;
      return;
    }

    tbody.innerHTML = trx.map(t => {
      const barber = getBarberById(t.barberId);
      const svcNames = t.services.map(s => s.name).join(', ');
      return `
        <tr class="hover:bg-white/2 transition-colors">
          <td class="py-2.5 pr-4 text-xs font-mono text-white/60">${t.id}</td>
          <td class="py-2.5 pr-4">
            <span class="text-sm font-medium text-white">${t.customer}</span>
          </td>
          <td class="py-2.5 pr-4 hidden md:table-cell text-xs text-white/50 max-w-[140px] truncate">${svcNames}</td>
          <td class="py-2.5 pr-4 hidden sm:table-cell">
            <span class="flex items-center gap-1.5 text-xs text-white/50">
              <i class="fa-solid ${methodIcon(t.method)} text-gold text-[10px]"></i>${methodLabel(t.method)}
            </span>
          </td>
          <td class="py-2.5 text-right">
            <span class="text-sm font-semibold text-white">${formatRp(t.total)}</span>
          </td>
        </tr>`;
    }).join('');
  },

  renderQueue() {
    const list  = document.getElementById('queue-list');
    const empty = document.getElementById('queue-empty');
    const lbl   = document.getElementById('queue-count-lbl');
    const q = AppData.queue;

    lbl.textContent = q.length + ' waiting';
    list.classList.toggle('hidden', q.length === 0);
    empty.classList.toggle('hidden', q.length > 0);

    list.innerHTML = q.map((item, i) => `
      <div class="flex items-center gap-3 glass rounded-xl px-3 py-2.5">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white/80 flex-shrink-0" style="background:rgba(201,168,76,.18)">
          ${i + 1}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">${item.name}</p>
          <p class="text-xs text-white/35">${item.time} · ${item.service || 'Walk-in'}</p>
        </div>
        <button onclick="Dashboard.removeFromQueue(${i})" class="text-white/25 hover:text-red-400 transition-colors text-xs">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`
    ).join('');
  },

  initCharts() {
    Chart.defaults.color = '#6B6B6B';
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.borderColor = '#EBEBEB';
    this.initRevenueChart();
    this.initPaymentChart();
  },

  initRevenueChart() {
    const ctx = document.getElementById('chart-dash-revenue');
    if (!ctx) return;
    if (this.charts.revenue) this.charts.revenue.destroy();

    const data = this._weekData();
    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Revenue',
          data: data.values,
          backgroundColor: 'rgba(123,175,212,.3)',
          borderColor: '#7BAFD4',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          hoverBackgroundColor: 'rgba(123,175,212,.55)',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: '#1A1A1A', borderColor: '#E8E8E6', borderWidth: 1,
          titleColor: '#FFFFFF', bodyColor: '#CCCCCC',
          callbacks: { label: ctx => formatRp(ctx.raw) }
        }},
        scales: {
          x: { grid: { color: '#EBEBEB' }, ticks: { font: { size: 11 }, color: '#8A8A8A' } },
          y: { grid: { color: '#EBEBEB' }, ticks: { font: { size: 11 }, color: '#8A8A8A', callback: v => 'RM ' + v } }
        }
      }
    });
  },

  initPaymentChart() {
    const ctx = document.getElementById('chart-dash-payment');
    if (!ctx) return;
    if (this.charts.payment) this.charts.payment.destroy();

    const trx  = todayTransactions();
    const cash  = trx.filter(t => t.method === 'cash').reduce((s, t) => s + t.total, 0);
    const card  = trx.filter(t => t.method === 'card').reduce((s, t) => s + t.total, 0);
    const qr    = trx.filter(t => t.method === 'qr').reduce((s, t) => s + t.total, 0);

    const legendEl = document.getElementById('payment-legend');
    const colors = ['#7BAFD4','#82C09A','#E8A598'];
    const labels = ['Cash','Card','QR Pay'];
    const values = [cash, card, qr];

    if (legendEl) {
      legendEl.innerHTML = labels.map((l, i) => `
        <div class="flex items-center justify-between text-xs">
          <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm inline-block" style="background:${colors[i]}"></span><span class="text-white/55">${l}</span></span>
          <span class="text-white font-semibold">${formatRp(values[i])}</span>
        </div>`).join('');
    }

    this.charts.payment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values.map(v => v || 0.01), backgroundColor: colors.map(c => c + 'CC'), borderColor: '#FFFFFF', borderWidth: 3, hoverOffset: 6 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#374151', borderColor: '#E8E8E6', borderWidth: 1, titleColor:'#FFFFFF', bodyColor:'#DDDDDD', callbacks: { label: ctx => formatRp(ctx.raw) } } }
      }
    });
  },

  _weekData() {
    const labels = [], values = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const day = d.toLocaleDateString('en', { weekday: 'short' });
      labels.push(day);
      values.push(branchTransactions().filter(t => t.date === ds).reduce((s, t) => s + t.total, 0));
    }
    return { labels, values };
  },

  switchDashChart(btn, range) {
    document.querySelectorAll('[onclick*="switchDashChart"]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // regenerate revenue chart with different data
    if (this.charts.revenue) this.charts.revenue.destroy();
    const ctx = document.getElementById('chart-dash-revenue');
    const data = range === 'month' ? this._monthData() : this._weekData();
    this.charts.revenue = new Chart(ctx, {
      type: 'bar',
      data: { labels: data.labels, datasets: [{ label:'Revenue', data: data.values, backgroundColor:'rgba(123,175,212,.3)', borderColor:'#7BAFD4', borderWidth:2, borderRadius:8, borderSkipped:false, hoverBackgroundColor:'rgba(123,175,212,.55)' }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#374151', borderColor:'#E8E8E6', borderWidth:1, titleColor:'#FFFFFF', bodyColor:'#DDDDDD', callbacks:{ label: ctx => formatRp(ctx.raw) } } }, scales:{ x:{grid:{color:'#EBEBEB'},ticks:{color:'#8A8A8A'}}, y:{grid:{color:'#EBEBEB'},ticks:{color:'#8A8A8A',callback:v=>'RM '+v}} } }
    });
  },

  _monthData() {
    const labels = [], values = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      if (i % 5 === 0) {
        labels.push(d.getDate() + '/' + (d.getMonth()+1));
        values.push(branchTransactions().filter(t => t.date === ds).reduce((s, t) => s + t.total, 0));
      }
    }
    return { labels, values };
  }
};

// ── Queue ────────────────────────────────────────────────────
function addToQueue() {
  const name = prompt('Customer name:');
  if (!name || !name.trim()) return;
  const service = prompt('Service (optional):') || '';
  const now = new Date().toTimeString().slice(0,5);
  AppData.queue.push({ name: name.trim(), service: service.trim(), time: now });
  AppData.save('queue');
  Dashboard.renderQueue();
  showToast(`${name.trim()} added to queue`, 'success');
}

Dashboard.removeFromQueue = function(i) {
  AppData.queue.splice(i, 1);
  AppData.save('queue');
  Dashboard.renderQueue();
};

// ── Shift Report ─────────────────────────────────────────────
function openShiftReport() {
  const trx = todayTransactions();
  const revenue = trx.reduce((s, t) => s + t.total, 0);
  const cash    = trx.filter(t => t.method === 'cash').reduce((s, t) => s + t.total, 0);
  const card    = trx.filter(t => t.method === 'card').reduce((s, t) => s + t.total, 0);
  const qr      = trx.filter(t => t.method === 'qr').reduce((s, t) => s + t.total, 0);
  const avg     = trx.length ? revenue / trx.length : 0;
  const customers = new Set(trx.map(t => t.customer)).size;

  document.getElementById('shift-date-lbl').textContent = formatDate(today());
  document.getElementById('shift-revenue').textContent  = formatRp(revenue);
  document.getElementById('shift-trx-count').textContent= trx.length;
  document.getElementById('shift-customers').textContent = customers;
  document.getElementById('shift-avg').textContent       = formatRp(avg);
  document.getElementById('shift-cash-collected').textContent = formatRp(cash);
  document.getElementById('shift-drawer-total').textContent   = formatRp(cash);

  const payBreak = document.getElementById('shift-pay-breakdown');
  payBreak.innerHTML = [['Cash',cash],['Card',card],['QR Pay',qr]].map(([l,v]) => `
    <div class="flex justify-between text-sm">
      <span class="text-white/45">${l}</span>
      <span class="text-white font-semibold">${formatRp(v)}</span>
    </div>`).join('');

  const barbPerf = document.getElementById('shift-barber-perf');
  barbPerf.innerHTML = branchBarbers().map(b => {
    const bTrx = trx.filter(t => t.barberId == b.id);
    const bRev = bTrx.reduce((s, t) => s + t.total, 0);
    const comm = Math.round(bRev * b.commission / 100);
    return `<div class="flex justify-between text-sm">
      <span class="text-white/45">${b.name}</span>
      <span class="text-white font-semibold">${formatRp(bRev)} <span class="text-xs text-gold ml-1">(${formatRp(comm)} comm.)</span></span>
    </div>`;
  }).join('');

  openModal('modal-shift');
}
