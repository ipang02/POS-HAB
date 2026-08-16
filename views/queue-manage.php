<!-- ══ VIEW: WALK-IN QUEUE MANAGEMENT ════════════════════════ -->
<section id="view-queue" class="view">

  <!-- ── Top bar: stats + add button ───────────────────────── -->
  <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
    <div class="flex items-center gap-3">
      <div class="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:#fbbf24;box-shadow:0 0 0 0 rgba(251,191,36,.4);animation:livePulse 1.8s ease infinite"></span>
        <span class="text-sm font-semibold text-white" id="qp-waiting-lbl">0 waiting</span>
      </div>
      <div class="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
        <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:#4ade80"></span>
        <span class="text-sm font-semibold text-white" id="qp-serving-lbl">0 serving</span>
      </div>
    </div>
    <button onclick="QueuePage.openAddModal()"
      class="btn-gold px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
      <i class="fa-solid fa-user-plus text-[13px]"></i> Add Walk-in
    </button>
  </div>

  <!-- ── Now Serving ────────────────────────────────────────── -->
  <div id="qp-serving-section" class="hidden mb-6">
    <p class="text-[10px] font-bold uppercase tracking-[.14em] mb-3 gold-text">
      <i class="fa-solid fa-scissors mr-1.5"></i>Now Serving
    </p>
    <div id="qp-serving-list" class="space-y-3"></div>
  </div>

  <!-- ── Waiting Queue ──────────────────────────────────────── -->
  <div>
    <p class="text-[10px] font-bold uppercase tracking-[.14em] mb-3 text-white/35" id="qp-waiting-title">
      <i class="fa-solid fa-users mr-1.5"></i>Waiting Queue
    </p>
    <div id="qp-waiting-list" class="space-y-3"></div>
  </div>

  <!-- ── Empty state ────────────────────────────────────────── -->
  <div id="qp-empty" class="text-center py-20 hidden">
    <div class="w-20 h-20 rounded-2xl glass-gold flex items-center justify-center mx-auto mb-4">
      <i class="fa-solid fa-chair text-gold text-3xl"></i>
    </div>
    <p class="text-base font-bold text-white/35">No walk-ins today</p>
    <p class="text-sm text-white/20 mt-1">Customers can scan the QR code to join, or tap Add Walk-in above</p>
  </div>

  <style>
    @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  </style>

</section>
