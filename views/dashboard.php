<!-- ══ VIEW: DASHBOARD ══════════════════════════════════════ -->
<section id="view-dashboard" class="view active">

  <!-- KPI Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

    <div class="kpi-card col-span-2 lg:col-span-1">
      <div class="flex items-start justify-between mb-4">
        <div class="w-11 h-11 rounded-xl glass-gold flex items-center justify-center">
          <i class="fa-solid fa-coins text-gold text-base"></i>
        </div>
        <span class="text-[11px] font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">+12.4%</span>
      </div>
      <p class="text-[10px] text-white/35 font-semibold uppercase tracking-widest mb-1">Revenue Today</p>
      <div class="text-[22px] font-bold text-white leading-tight" id="kpi-revenue">RM 0</div>
      <p class="text-[11px] text-white/30 mt-1">vs yesterday <span class="text-green-400">↑</span></p>
    </div>

    <div class="kpi-card">
      <div class="flex items-start justify-between mb-4">
        <div class="w-11 h-11 rounded-xl bg-blue-500/14 flex items-center justify-center">
          <i class="fa-solid fa-user-group text-blue-400 text-base"></i>
        </div>
        <span class="text-[11px] font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">Today</span>
      </div>
      <p class="text-[10px] text-white/35 font-semibold uppercase tracking-widest mb-1">Customers</p>
      <div class="text-[22px] font-bold text-white leading-tight" id="kpi-customers">0</div>
      <p class="text-[11px] text-white/30 mt-1">served today</p>
    </div>

    <div class="kpi-card">
      <div class="flex items-start justify-between mb-4">
        <div class="w-11 h-11 rounded-xl bg-purple-500/14 flex items-center justify-center">
          <i class="fa-solid fa-scissors text-purple-400 text-base"></i>
        </div>
        <span class="text-[11px] font-semibold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">On Shift</span>
      </div>
      <p class="text-[10px] text-white/35 font-semibold uppercase tracking-widest mb-1">Active Barbers</p>
      <div class="text-[22px] font-bold text-white leading-tight" id="kpi-barbers">0</div>
      <p class="text-[11px] text-white/30 mt-1">of <span id="kpi-barbers-total">0</span> registered</p>
    </div>

    <div class="kpi-card">
      <div class="flex items-start justify-between mb-4">
        <div class="w-11 h-11 rounded-xl bg-amber-500/14 flex items-center justify-center">
          <i class="fa-solid fa-calendar-check text-amber-400 text-base"></i>
        </div>
        <span class="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Pending</span>
      </div>
      <p class="text-[10px] text-white/35 font-semibold uppercase tracking-widest mb-1">Appointments</p>
      <div class="text-[22px] font-bold text-white leading-tight" id="kpi-appts">0</div>
      <p class="text-[11px] text-white/30 mt-1">need confirmation</p>
    </div>
  </div>

  <!-- Charts Row -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

    <!-- Weekly Revenue Bar Chart -->
    <div class="glass rounded-2xl p-5 lg:col-span-2">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-sm font-bold text-white">Weekly Revenue</h3>
          <p class="text-xs text-white/35 mt-0.5">Performance overview</p>
        </div>
        <div class="flex gap-1">
          <button class="tab-btn active text-xs" onclick="Dashboard.switchDashChart(this,'week')">Week</button>
          <button class="tab-btn text-xs" onclick="Dashboard.switchDashChart(this,'month')">Month</button>
        </div>
      </div>
      <div style="position:relative;height:200px">
        <canvas id="chart-dash-revenue"></canvas>
      </div>
    </div>

    <!-- Payment Method Donut -->
    <div class="glass rounded-2xl p-5">
      <div class="mb-4">
        <h3 class="text-sm font-bold text-white">Payment Methods</h3>
        <p class="text-xs text-white/35 mt-0.5">Today's breakdown</p>
      </div>
      <div style="position:relative;height:160px">
        <canvas id="chart-dash-payment"></canvas>
      </div>
      <div class="mt-3 space-y-1.5" id="payment-legend"></div>
    </div>
  </div>

  <!-- Queue + Recent Transactions -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

    <!-- Walk-in Queue -->
    <div class="glass rounded-2xl p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-bold text-white">Walk-in Queue</h3>
          <p class="text-xs text-white/35 mt-0.5" id="queue-count-lbl">0 waiting</p>
        </div>
        <button onclick="addToQueue()" class="btn-gold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
          <i class="fa-solid fa-plus text-[10px]"></i> Add
        </button>
      </div>
      <div id="queue-list" class="space-y-2 max-h-52 overflow-y-auto"></div>
      <div id="queue-empty" class="text-center py-8">
        <i class="fa-solid fa-chair text-3xl text-white/14 mb-2 block"></i>
        <p class="text-xs text-white/25">No walk-ins yet</p>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="glass rounded-2xl p-5 lg:col-span-2">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-bold text-white">Recent Transactions</h3>
          <p class="text-xs text-white/35 mt-0.5">Last 8 records</p>
        </div>
        <button onclick="navigate('analytics')" class="btn-outline text-xs px-3 py-1.5 rounded-lg">View All</button>
      </div>
      <div class="table-wrap">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/6">
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">ID</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Customer</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden md:table-cell">Service</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden sm:table-cell">Method</th>
              <th class="text-right text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5">Amount</th>
            </tr>
          </thead>
          <tbody id="recent-trx-tbody" class="divide-y divide-white/4 text-sm"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- End of Day -->
  <div class="mt-5 flex justify-end">
    <button onclick="openShiftReport()"
      class="btn-outline flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold">
      <i class="fa-solid fa-flag-checkered text-gold"></i>
      End of Day Report
    </button>
  </div>

</section>
