<!-- ══ MODAL: ADD / EDIT CUSTOMER ════════════════════════════ -->
<div id="modal-customer" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-md">
    <div class="p-6">

      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white" id="cust-modal-title">Add Customer</h3>
          <p class="text-xs text-white/40 mt-0.5">Phone number is the unique customer identifier</p>
        </div>
        <button onclick="closeModal('modal-customer')"
          class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <input type="hidden" id="cust-edit-id">

      <div class="space-y-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Full Name <span class="text-red-400">*</span></label>
          <input type="text" id="cust-name" placeholder="e.g. Ahmad bin Abdullah" class="inp">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone Number <span class="text-red-400">*</span></label>
          <input type="text" id="cust-phone" placeholder="019-3456789" class="inp">
          <p class="text-[10px] text-white/30 mt-1">Used as unique customer ID across all branches</p>
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Notes <span class="text-white/25">(optional)</span></label>
          <textarea id="cust-notes" rows="3"
            placeholder="Preferences, allergies, special requests…" class="inp resize-none"></textarea>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick="closeModal('modal-customer')"
          class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="Customers.save()"
          class="btn-gold flex-1 py-2.5 rounded-xl text-sm font-bold">Save Customer</button>
      </div>

    </div>
  </div>
</div>

<!-- ══ MODAL: CUSTOMER DETAIL ════════════════════════════════ -->
<div id="modal-customer-detail" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-sm">
    <div class="p-6">

      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-white">Customer Profile</h3>
        <button onclick="closeModal('modal-customer-detail')"
          class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Avatar + Identity -->
      <div class="flex items-center gap-4 mb-5">
        <div id="cust-detail-avatar"
          class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 select-none"
          style="background:#374151">??</div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-white" id="cust-detail-name">—</h3>
          <p class="text-xs text-white/40 mt-0.5" id="cust-detail-phone">—</p>
          <span class="inline-flex items-center gap-1 mt-1.5 glass-gold rounded-full px-2.5 py-0.5">
            <i class="fa-solid fa-star text-gold text-[10px]"></i>
            <span class="text-[11px] font-semibold text-gold" id="cust-detail-points">0 pts</span>
          </span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-xl font-bold text-white" id="cust-detail-visits">0</div>
          <div class="text-[10px] text-white/35 mt-0.5">Total Visits</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-base font-bold gold-text" id="cust-detail-spent">RM 0</div>
          <div class="text-[10px] text-white/35 mt-0.5">Total Spent</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-xs font-bold text-white leading-tight" id="cust-detail-last-visit">—</div>
          <div class="text-[10px] text-white/35 mt-0.5">Last Visit</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-xs font-bold text-white leading-tight truncate" id="cust-detail-fav-service">—</div>
          <div class="text-[10px] text-white/35 mt-0.5">Fav. Service</div>
        </div>
      </div>

      <!-- Preferred Barber -->
      <div class="glass rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <i class="fa-solid fa-scissors text-gold text-sm flex-shrink-0"></i>
        <div>
          <p class="text-[10px] text-white/35 uppercase tracking-wide font-semibold">Preferred Barber</p>
          <p class="text-sm font-semibold text-white" id="cust-detail-barber">—</p>
        </div>
      </div>

      <!-- Notes -->
      <div class="glass rounded-xl px-4 py-3 mb-4">
        <p class="text-[10px] text-white/35 uppercase tracking-wide font-semibold mb-1">Notes</p>
        <p class="text-sm text-white/70" id="cust-detail-notes">No notes</p>
      </div>

      <!-- Visit History -->
      <div class="glass rounded-xl p-4 mb-5">
        <p class="text-[10px] text-white/35 uppercase tracking-wide font-semibold mb-3">Visit History</p>
        <div id="cust-detail-history" class="max-h-48 overflow-y-auto"></div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button id="cust-detail-edit-btn"
          class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">
          <i class="fa-solid fa-pen mr-1"></i> Edit
        </button>
        <button id="cust-detail-delete-btn"
          class="btn-danger flex-1 py-2.5 rounded-xl text-sm font-semibold">
          <i class="fa-solid fa-trash mr-1"></i> Delete
        </button>
      </div>

    </div>
  </div>
</div>
