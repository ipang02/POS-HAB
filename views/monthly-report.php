<!-- ══ VIEW: MONTHLY REPORT ═══════════════════════════════════ -->
<section id="view-monthly-report" class="view">

  <!-- Locked state -->
  <div id="mr-locked">
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style="background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.25)">
        <i class="fa-solid fa-lock text-2xl text-gold"></i>
      </div>
      <h3 class="text-white font-bold text-lg mb-1.5">Owner Access Required</h3>
      <p class="text-white/38 text-sm mb-6 max-w-xs">Monthly report contains commission and revenue data. Enter the owner PIN to continue.</p>
      <button onclick="MonthlyReport.unlock()" class="btn-gold px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2">
        <i class="fa-solid fa-unlock text-sm"></i> Enter PIN
      </button>
    </div>
  </div>

  <!-- Report content (hidden until unlocked) -->
  <div id="mr-content" class="hidden">

    <!-- Header + pickers -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 class="text-lg font-bold text-white">Monthly Report</h2>
        <p class="text-xs text-white/35 mt-0.5" id="mr-subtitle">Loading…</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <select id="mr-month" class="sel py-2.5 text-sm" onchange="MonthlyReport.render()"></select>
        <select id="mr-year"  class="sel py-2.5 text-sm" onchange="MonthlyReport.render()"></select>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" id="mr-summary-cards"></div>

    <!-- Barber commission table -->
    <div class="glass rounded-2xl p-5 mb-6">
      <h3 class="text-sm font-bold text-white mb-4">
        <i class="fa-solid fa-scissors mr-2 text-white/35 text-xs"></i>Barber Commission Breakdown
      </h3>
      <div class="table-wrap">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/6">
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Barber</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Trx</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Pax</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Revenue</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden sm:table-cell">Comm %</th>
              <th class="text-right text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5">Commission</th>
            </tr>
          </thead>
          <tbody id="mr-barber-tbody" class="divide-y divide-white/4 text-sm"></tbody>
        </table>
      </div>
    </div>

    <!-- Top services table -->
    <div class="glass rounded-2xl p-5">
      <h3 class="text-sm font-bold text-white mb-4">
        <i class="fa-solid fa-list-check mr-2 text-white/35 text-xs"></i>Top Services
      </h3>
      <div class="table-wrap">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/6">
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Service</th>
              <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Count</th>
              <th class="text-right text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5">Revenue</th>
            </tr>
          </thead>
          <tbody id="mr-services-tbody" class="divide-y divide-white/4 text-sm"></tbody>
        </table>
      </div>
    </div>

  </div><!-- /mr-content -->

</section>
