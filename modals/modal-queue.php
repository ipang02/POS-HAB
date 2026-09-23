<!-- ══ MODAL: ADD WALK-IN TO QUEUE ═════════════════════════════ -->
<div id="modal-queue-add" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-sm">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white">Add Walk-in</h3>
          <p class="text-xs text-white/40 mt-0.5">Enter customer details</p>
        </div>
        <button onclick="closeModal('modal-queue-add')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <div class="space-y-4">

        <!-- Customer Name -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Customer Name <span class="text-red-400">*</span></label>
          <input id="qadd-name" type="text" class="inp" placeholder="e.g. Ali Hassan">
        </div>

        <!-- Phone Number -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone Number</label>
          <input id="qadd-phone" type="tel" class="inp" placeholder="e.g. 0123456789">
        </div>

        <!-- Additional Pax Names -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs text-white/45 font-medium">Additional Pax Names</label>
            <button type="button" onclick="QueueManager.addPaxRow()"
              class="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
              style="background:rgba(201,168,76,.12);color:#C9A84C">
              <i class="fa-solid fa-plus text-[9px]"></i> Add Pax
            </button>
          </div>
          <div id="qadd-pax-rows" class="space-y-2"></div>
          <p class="text-[10px] text-white/25 mt-1.5">Leave empty for solo. Add names for each additional person.</p>
        </div>

      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal('modal-queue-add')" class="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="QueueManager.add()" class="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">Add to Queue</button>
      </div>

    </div>
  </div>
</div>
