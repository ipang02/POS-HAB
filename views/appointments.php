<!-- ══ VIEW: APPOINTMENTS ═══════════════════════════════════ -->
<section id="view-appointments" class="view">

  <!-- Header Controls -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-3">
      <button onclick="Appointments.prevWeek()" class="btn-outline w-9 h-9 flex items-center justify-center rounded-xl">
        <i class="fa-solid fa-chevron-left text-xs"></i>
      </button>
      <div class="text-center">
        <h3 class="text-sm font-bold text-white" id="cal-week-label">Week of —</h3>
        <p class="text-xs text-white/35" id="cal-week-sub">Loading…</p>
      </div>
      <button onclick="Appointments.nextWeek()" class="btn-outline w-9 h-9 flex items-center justify-center rounded-xl">
        <i class="fa-solid fa-chevron-right text-xs"></i>
      </button>
      <button onclick="Appointments.goToday()" class="tab-btn text-xs">Today</button>
    </div>
    <div class="flex gap-2 flex-wrap">
      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs text-white/45">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-400/60 inline-block"></span>Pending</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-blue-400/60 inline-block"></span>Confirmed</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-green-400/60 inline-block"></span>Completed</span>
      </div>
      <button onclick="Appointments.openBookingModal()" class="btn-gold px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fa-solid fa-plus text-[11px]"></i> Book Appointment
      </button>
    </div>
  </div>

  <!-- Calendar Grid -->
  <div class="glass rounded-2xl overflow-hidden mb-6">
    <div class="table-wrap">
      <div id="cal-grid" style="min-width:700px"></div>
    </div>
  </div>

  <!-- Appointments List -->
  <div class="glass rounded-2xl p-5">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-bold text-white">Today's Schedule</h3>
        <p class="text-xs text-white/35 mt-0.5" id="appt-list-sub">Loading…</p>
      </div>
      <div class="flex gap-2">
        <select id="appt-filter-status" class="sel py-1.5 text-xs" style="width:130px" onchange="Appointments.renderList()">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select id="appt-filter-barber" class="sel py-1.5 text-xs" style="width:130px" onchange="Appointments.renderList()">
          <option value="all">All Barbers</option>
        </select>
      </div>
    </div>
    <div class="table-wrap">
      <table class="w-full">
        <thead>
          <tr class="border-b border-white/6">
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Time</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Customer</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Service</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4 hidden md:table-cell">Barber</th>
            <th class="text-left text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5 pr-4">Status</th>
            <th class="text-right text-[10px] font-semibold text-white/28 uppercase tracking-wide pb-2.5">Action</th>
          </tr>
        </thead>
        <tbody id="appt-list-tbody" class="divide-y divide-white/4 text-sm"></tbody>
      </table>
    </div>
    <div id="appt-list-empty" class="hidden text-center py-10">
      <i class="fa-regular fa-calendar-xmark text-3xl text-white/14 mb-2 block"></i>
      <p class="text-sm text-white/30">No appointments found</p>
    </div>
  </div>

</section>
