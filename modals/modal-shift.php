<!-- ══ MODAL: END OF DAY / SHIFT REPORT ════════════════════ -->
<div id="modal-shift" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-lg">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white">End of Day Report</h3>
          <p class="text-xs text-white/40 mt-0.5" id="shift-date-lbl">—</p>
        </div>
        <button onclick="closeModal('modal-shift')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <div class="glass-gold rounded-xl p-4 text-center">
          <p class="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Revenue</p>
          <div class="text-xl font-bold gold-text" id="shift-revenue">RM 0</div>
        </div>
        <div class="glass rounded-xl p-4 text-center">
          <p class="text-[10px] text-white/40 uppercase tracking-widest mb-1">Transactions</p>
          <div class="text-xl font-bold text-white" id="shift-trx-count">0</div>
        </div>
        <div class="glass rounded-xl p-4 text-center">
          <p class="text-[10px] text-white/40 uppercase tracking-widest mb-1">Customers</p>
          <div class="text-xl font-bold text-white" id="shift-customers">0</div>
        </div>
        <div class="glass rounded-xl p-4 text-center">
          <p class="text-[10px] text-white/40 uppercase tracking-widest mb-1">Avg. Order</p>
          <div class="text-xl font-bold text-white" id="shift-avg">RM 0</div>
        </div>
      </div>

      <!-- Payment Breakdown -->
      <div class="glass rounded-xl p-4 mb-4">
        <h4 class="text-xs font-semibold text-white/45 uppercase tracking-wide mb-3">Payment Breakdown</h4>
        <div class="space-y-2" id="shift-pay-breakdown"></div>
      </div>

      <!-- Barber Performance -->
      <div class="glass rounded-xl p-4 mb-5">
        <h4 class="text-xs font-semibold text-white/45 uppercase tracking-wide mb-3">Barber Performance</h4>
        <div class="space-y-2" id="shift-barber-perf"></div>
      </div>

      <!-- Cash Reconciliation -->
      <div class="glass-gold rounded-xl p-4 mb-5">
        <h4 class="text-xs font-semibold text-gold/70 uppercase tracking-wide mb-3">Cash Drawer</h4>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-white/50">Opening Balance</span>
          <span class="text-white font-semibold">RM 0</span>
        </div>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-white/50">Cash Collected</span>
          <span class="text-green-400 font-semibold" id="shift-cash-collected">RM 0</span>
        </div>
        <div class="flex justify-between text-sm font-bold border-t border-white/12 pt-2 mt-2">
          <span class="text-white">Expected in Drawer</span>
          <span class="gold-text" id="shift-drawer-total">RM 0</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <button onclick="closeModal('modal-shift')" class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">Close</button>
        <button onclick="window.print()" class="btn-gold flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <i class="fa-solid fa-print"></i> Print Report
        </button>
      </div>

    </div>
  </div>
</div>
