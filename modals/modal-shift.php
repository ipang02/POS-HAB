<!-- ══ MODAL: OPEN SESSION ══════════════════════════════════ -->
<div id="modal-open-session" class="modal-overlay hidden" onclick="if(event.target===this)closeModal('modal-open-session')">
  <div class="modal-card max-w-sm mx-auto">
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Open POS Session</h3>
        <p class="text-xs text-white/35 mt-0.5">Enter today's opening cash float to begin</p>
      </div>
      <button onclick="closeModal('modal-open-session')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5">
      <label class="text-xs text-white/45 mb-1.5 block font-medium">Opening Cash Float (RM)</label>
      <input type="number" id="open-session-float" min="0" step="0.50" placeholder="0.00"
        class="inp text-center text-xl" onkeydown="if(event.key==='Enter')SessionManager.open()">
      <p class="text-[10px] text-white/30 mt-2 text-center">This is the amount of cash physically in the drawer right now.</p>
    </div>
    <div class="modal-footer">
      <button onclick="closeModal('modal-open-session')" class="btn-outline flex-1">Cancel</button>
      <button id="btn-open-session" onclick="SessionManager.open()" class="btn-gold flex-1 flex items-center justify-center gap-2">
        <i class="fa-solid fa-lock-open text-sm"></i> Open Session
      </button>
    </div>
  </div>
</div>

<!-- ══ MODAL: CLOSE SESSION ═════════════════════════════════ -->
<div id="modal-close-session" class="modal-overlay hidden" onclick="if(event.target===this)closeModal('modal-close-session')">
  <div class="modal-card max-w-lg mx-auto">

    <!-- Step 1: Cash count input -->
    <div id="close-step-1">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Close Session</h3>
          <p class="text-xs text-white/35 mt-0.5">Count the cash in your drawer and enter the total</p>
        </div>
        <button onclick="closeModal('modal-close-session')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Actual Cash in Drawer (RM)</label>
          <input type="number" id="close-actual-cash" min="0" step="0.50" placeholder="0.00"
            class="inp text-center text-xl">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Note (optional)</label>
          <input type="text" id="close-note" placeholder="e.g. Short by RM 5 — checked with staff"
            class="inp text-sm">
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal('modal-close-session')" class="btn-outline flex-1">Cancel</button>
        <button onclick="SessionManager.generateReport()" class="btn-gold flex-1 flex items-center justify-center gap-2">
          <i class="fa-solid fa-chart-bar text-sm"></i> Generate Report
        </button>
      </div>
    </div>

    <!-- Step 2: Shift report -->
    <div id="close-step-2" class="hidden">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Shift Report</h3>
          <p class="text-xs text-white/35 mt-0.5" id="close-shift-date-lbl">—</p>
        </div>
        <button onclick="closeModal('modal-close-session')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="p-5 overflow-y-auto" style="max-height:65vh">
        <div id="shift-report-print">
          <div id="shift-report-content"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="window.print()" class="btn-outline flex-1 flex items-center justify-center gap-2">
          <i class="fa-solid fa-print text-sm"></i> Print
        </button>
        <button id="btn-close-session" onclick="SessionManager.close()" class="btn-gold flex-1 flex items-center justify-center gap-2">
          <i class="fa-solid fa-door-closed text-sm"></i> Close Session
        </button>
      </div>
    </div>

  </div>
</div>

<!-- ══ MODAL: OWNER PIN VERIFY (for close session) ══════════ -->
<div id="modal-pin-close" class="modal-overlay hidden" onclick="if(event.target===this)closeModal('modal-pin-close')">
  <div class="modal-card max-w-xs mx-auto">
    <div class="modal-header">
      <h3 class="modal-title">Owner PIN Required</h3>
      <button onclick="closeModal('modal-pin-close')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5">
      <label class="text-xs text-white/45 mb-1.5 block font-medium">Enter Owner PIN (4 digits)</label>
      <input type="password" id="pin-close-input" maxlength="4" inputmode="numeric"
        placeholder="••••" class="inp text-center text-2xl tracking-widest"
        onkeydown="if(event.key==='Enter')SessionManager._verifyOwnerPin()">
    </div>
    <div class="modal-footer">
      <button onclick="closeModal('modal-pin-close')" class="btn-outline flex-1">Cancel</button>
      <button onclick="SessionManager._verifyOwnerPin()" class="btn-gold flex-1">Confirm</button>
    </div>
  </div>
</div>

<!-- Print-only: hide everything except shift report -->
<style>
  @media print {
    body > *:not(#print-receipt) { display: none !important; }
    #shift-report-print { display: block !important; padding: 24px; color: #000; background: #fff; }
  }
</style>
