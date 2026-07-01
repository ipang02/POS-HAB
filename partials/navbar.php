<!-- ══ Top Navbar ═══════════════════════════════════════════ -->
<header id="navbar" class="sticky top-0 z-30 bg-ink-800/80 backdrop-blur-xl border-b border-white/5 px-6 py-[14px] no-print">
  <div class="flex items-center justify-between gap-4">

    <!-- Left: Mobile toggle + page title -->
    <div class="flex items-center gap-4">
      <button onclick="toggleMobileSidebar()"
        class="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/6 text-white/50 transition-colors">
        <i class="fa-solid fa-bars text-sm"></i>
      </button>
      <div>
        <h1 id="page-title" class="text-[15px] font-bold text-white leading-tight">Dashboard</h1>
        <p id="page-sub" class="text-[11px] text-white/35"></p>
      </div>
    </div>

    <!-- Right: Search, Clock, Notifications, Avatar -->
    <div class="flex items-center gap-2.5">

      <!-- Search -->
      <div class="relative hidden md:block">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input id="global-search" type="text" placeholder="Search…"
          class="bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-[7px] text-sm text-white placeholder-white/22
                 focus:outline-none focus:border-gold/40 w-44 focus:w-60 transition-all">
      </div>

      <!-- Branch Switcher -->
      <div class="relative">
        <button onclick="toggleBranchDropdown()"
          class="flex items-center gap-2 glass px-3 py-[7px] rounded-xl hover:border-white/14 transition-colors cursor-pointer">
          <i class="fa-solid fa-code-branch text-[11px]" style="color:#6B7280"></i>
          <span id="branch-label" class="text-xs font-semibold text-white hidden sm:inline" style="max-width:110px">Kota Bharu</span>
          <i class="fa-solid fa-chevron-down text-[9px] text-white/30"></i>
        </button>
        <div id="branch-dropdown" class="hidden absolute right-0 top-full mt-2 glass-dark rounded-2xl shadow-2xl z-50 overflow-hidden" style="min-width:220px">
          <div class="px-4 py-3 border-b border-white/6">
            <p class="text-[10px] font-bold uppercase tracking-widest text-white/35">Select Branch</p>
          </div>
          <div id="branch-dropdown-items" class="py-1.5"></div>
        </div>
      </div>

      <!-- Live Clock -->
      <div class="hidden md:flex items-center gap-2 glass px-3.5 py-[7px] rounded-xl">
        <i class="fa-regular fa-clock text-gold text-xs"></i>
        <span id="live-clock" class="text-xs font-mono text-white/70 tabular-nums">00:00:00</span>
      </div>

      <!-- Notifications -->
      <div class="relative">
        <button onclick="toggleNotifDropdown()"
          class="w-9 h-9 flex items-center justify-center rounded-xl glass hover:border-white/14 relative transition-colors">
          <i class="fa-solid fa-bell text-white/60 text-sm"></i>
          <span class="absolute top-[7px] right-[7px] w-2 h-2 bg-red-500 rounded-full dot-pulse"></span>
        </button>

        <!-- Dropdown -->
        <div id="notif-dropdown" class="hidden absolute right-0 top-full mt-2 w-80 glass-dark rounded-2xl shadow-2xl z-50">
          <div class="flex items-center justify-between px-4 py-3 border-b border-white/6">
            <span class="text-sm font-semibold text-white">Notifications</span>
            <span class="text-xs text-gold cursor-pointer hover:text-gold-light transition-colors">Mark all read</span>
          </div>
          <div class="py-1 max-h-72 overflow-y-auto" id="notif-list">
            <!-- populated by JS -->
            <div class="flex gap-3 px-4 py-3 hover:bg-white/4 cursor-pointer rounded-xl mx-1 transition-colors">
              <div class="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fa-solid fa-calendar-check text-gold text-xs"></i>
              </div>
              <div>
                <p class="text-[13px] text-white font-medium">New appointment booked</p>
                <p class="text-[11px] text-white/40">Andi Wijaya — Haircut 14:00</p>
                <p class="text-[10px] text-white/25 mt-0.5">2 min ago</p>
              </div>
            </div>
            <div class="flex gap-3 px-4 py-3 hover:bg-white/4 cursor-pointer rounded-xl mx-1 transition-colors">
              <div class="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fa-solid fa-triangle-exclamation text-red-400 text-xs"></i>
              </div>
              <div>
                <p class="text-[13px] text-white font-medium">Low stock alert</p>
                <p class="text-[11px] text-white/40">Barber Scissors — only 3 left</p>
                <p class="text-[10px] text-white/25 mt-0.5">15 min ago</p>
              </div>
            </div>
            <div class="flex gap-3 px-4 py-3 hover:bg-white/4 cursor-pointer rounded-xl mx-1 transition-colors">
              <div class="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i class="fa-solid fa-circle-check text-green-400 text-xs"></i>
              </div>
              <div>
                <p class="text-[13px] text-white font-medium">Payment received</p>
                <p class="text-[11px] text-white/40">RM 180 — Full Package</p>
                <p class="text-[10px] text-white/25 mt-0.5">1 hour ago</p>
              </div>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-white/6 text-center">
            <span class="text-xs text-gold/60 cursor-pointer hover:text-gold transition-colors">View all notifications</span>
          </div>
        </div>
      </div>

      <!-- Avatar -->
      <div class="w-9 h-9 rounded-xl btn-gold flex items-center justify-center text-[13px] font-bold cursor-pointer select-none">A</div>

    </div>
  </div>
</header>
