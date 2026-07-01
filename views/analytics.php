<!-- ══ VIEW: ANALYTICS ══════════════════════════════════════ -->
<section id="view-analytics" class="view">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 class="text-lg font-bold text-white">Sales Analytics</h2>
      <p class="text-xs text-white/35 mt-0.5">Revenue, services, and payment insights</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="flex gap-1 glass rounded-xl p-1">
        <button class="tab-btn active text-xs" data-range="week" onclick="Analytics.switchRange(this)">This Week</button>
        <button class="tab-btn text-xs" data-range="month" onclick="Analytics.switchRange(this)">This Month</button>
        <button class="tab-btn text-xs" data-range="30d" onclick="Analytics.switchRange(this)">Last 30 Days</button>
      </div>
      <button onclick="Analytics.exportCSV()" class="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
        <i class="fa-solid fa-file-csv text-green-400"></i> Export CSV
      </button>
    </div>
  </div>

  <!-- Summary Strip -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div class="glass rounded-2xl p-4 text-center">
      <p class="text-[10px] text-white/35 uppercase tracking-widest mb-1">Total Revenue</p>
      <div class="text-xl font-bold gold-text" id="an-total-rev">RM 0</div>
    </div>
    <div class="glass rounded-2xl p-4 text-center">
      <p class="text-[10px] text-white/35 uppercase tracking-widest mb-1">Transactions</p>
      <div class="text-xl font-bold text-white" id="an-total-trx">0</div>
    </div>
    <div class="glass rounded-2xl p-4 text-center">
      <p class="text-[10px] text-white/35 uppercase tracking-widest mb-1">Avg. Order</p>
      <div class="text-xl font-bold text-white" id="an-avg-order">RM 0</div>
    </div>
    <div class="glass rounded-2xl p-4 text-center">
      <p class="text-[10px] text-white/35 uppercase tracking-widest mb-1">Top Service</p>
      <div class="text-base font-bold text-white leading-tight" id="an-top-svc">—</div>
    </div>
  </div>

  <!-- Charts Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

    <!-- Revenue Trend -->
    <div class="glass rounded-2xl p-5">
      <h3 class="text-sm font-bold text-white mb-1">Revenue Trend</h3>
      <p class="text-xs text-white/35 mb-4">Daily revenue performance</p>
      <div style="position:relative;height:220px">
        <canvas id="chart-rev-trend"></canvas>
      </div>
    </div>

    <!-- Service Popularity -->
    <div class="glass rounded-2xl p-5">
      <h3 class="text-sm font-bold text-white mb-1">Service Popularity</h3>
      <p class="text-xs text-white/35 mb-4">Most booked services</p>
      <div style="position:relative;height:220px">
        <canvas id="chart-svc-pop"></canvas>
      </div>
    </div>

    <!-- Payment Breakdown -->
    <div class="glass rounded-2xl p-5">
      <h3 class="text-sm font-bold text-white mb-1">Payment Methods</h3>
      <p class="text-xs text-white/35 mb-4">Transaction split by method</p>
      <div class="flex items-center gap-6">
        <div style="position:relative;height:180px;width:180px;flex-shrink:0">
          <canvas id="chart-pay-method"></canvas>
        </div>
        <div id="pay-method-legend" class="flex-1 space-y-2.5"></div>
      </div>
    </div>

    <!-- Barber Performance -->
    <div class="glass rounded-2xl p-5">
      <h3 class="text-sm font-bold text-white mb-1">Barber Revenue</h3>
      <p class="text-xs text-white/35 mb-4">Revenue contribution per barber</p>
      <div style="position:relative;height:220px">
        <canvas id="chart-barber-perf"></canvas>
      </div>
    </div>
  </div>

  <!-- Transactions Table -->
  <div class="glass rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white">All Transactions</h3>
        <p class="text-xs text-white/35 mt-0.5" id="trx-table-sub">Showing all records</p>
      </div>
      <div class="relative hidden sm:block">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input type="text" id="trx-search" placeholder="Search transactions…"
          oninput="Analytics.filterTrx()" class="inp pl-9 py-2 text-xs" style="width:200px">
      </div>
    </div>
    <div class="table-wrap">
      <table class="w-full">
        <thead>
          <tr class="border-b border-white/6">
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">TRX ID</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Customer</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden md:table-cell">Services</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden md:table-cell">Barber</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden sm:table-cell">Method</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden lg:table-cell">Date</th>
            <th class="text-right text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5">Total</th>
          </tr>
        </thead>
        <tbody id="all-trx-tbody" class="divide-y divide-white/4 text-sm"></tbody>
      </table>
    </div>
  </div>

</section>
