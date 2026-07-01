<!-- ══ VIEW: BARBERS ════════════════════════════════════════ -->
<section id="view-barbers" class="view">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 class="text-lg font-bold text-white">Barber Team</h2>
      <p class="text-xs text-white/35 mt-0.5" id="barbers-summary">Loading…</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input type="text" id="barber-search" placeholder="Search barbers…"
          oninput="Barbers.filter()" class="inp pl-9 py-2.5 text-sm" style="width:180px">
      </div>
      <select id="barber-status-filter" class="sel py-2.5 text-sm" style="width:130px" onchange="Barbers.filter()">
        <option value="all">All Status</option>
        <option value="available">Available</option>
        <option value="busy">Busy</option>
        <option value="off">Off Duty</option>
      </select>
      <button onclick="BarbersCRUD.openAddModal()" class="btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fa-solid fa-plus text-[11px]"></i> Add Barber
      </button>
    </div>
  </div>

  <!-- Barber Cards Grid -->
  <div id="barbers-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"></div>

  <!-- Today's Assignments Table -->
  <div class="glass rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white">Today's Assignments</h3>
        <p class="text-xs text-white/35 mt-0.5">Appointments per barber today</p>
      </div>
    </div>
    <div class="table-wrap">
      <table class="w-full">
        <thead>
          <tr class="border-b border-white/6">
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Barber</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden sm:table-cell">Status</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Appts Today</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden md:table-cell">Commission %</th>
            <th class="text-right text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5">Earnings Today</th>
          </tr>
        </thead>
        <tbody id="barbers-assignments" class="divide-y divide-white/4 text-sm"></tbody>
      </table>
    </div>
  </div>

</section>
