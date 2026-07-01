<!-- ══ MODAL: ADD / EDIT BARBER ═════════════════════════════ -->
<div id="modal-barber" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-lg">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white" id="barber-modal-title">Add Barber</h3>
          <p class="text-xs text-white/40 mt-0.5" id="barber-modal-sub">Fill in the barber's details</p>
        </div>
        <button onclick="closeModal('modal-barber')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <input type="hidden" id="barber-edit-id">

      <!-- Avatar Preview -->
      <div class="flex items-center gap-4 glass rounded-2xl p-4 mb-5">
        <div id="barber-avatar-preview"
          class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 select-none"
          style="background:#374151">??</div>
        <div>
          <p class="text-sm font-semibold text-white" id="barber-name-preview">Barber Name</p>
          <p class="text-xs text-white/40 mt-0.5">Avatar auto-generated from initials</p>
          <div class="flex gap-1.5 mt-2 flex-wrap" id="barber-color-swatches"></div>
        </div>
      </div>

      <div class="space-y-4">

        <!-- Name -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Full Name <span class="text-red-400">*</span></label>
          <input type="text" id="barber-name" placeholder="e.g. Razif Hakim"
            oninput="BarbersCRUD.updatePreview()" class="inp">
        </div>

        <!-- Phone -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone Number</label>
          <input type="text" id="barber-phone" placeholder="019-3456789" class="inp">
        </div>

        <!-- Commission & Status -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Commission (%) <span class="text-red-400">*</span></label>
            <div class="relative">
              <input type="number" id="barber-commission" min="0" max="100" step="5" placeholder="30" class="inp pr-8">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
            </div>
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Status</label>
            <select id="barber-status" class="sel">
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off">Off Duty</option>
            </select>
          </div>
        </div>

        <!-- Skills -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Skills / Specialties</label>
          <div class="inp p-2 min-h-[42px]" style="height:auto;cursor:text" onclick="document.getElementById('barber-skill-input').focus()">
            <div class="flex flex-wrap gap-1.5 items-center" id="barber-skill-tags"></div>
            <input type="text" id="barber-skill-input" placeholder="Type skill, press Enter…"
              class="border-none outline-none bg-transparent text-sm text-white placeholder-white/25 mt-1 w-full"
              onkeydown="BarbersCRUD.handleSkillKey(event)" style="min-width:120px">
          </div>
          <p class="text-[10px] text-white/30 mt-1">Press <kbd class="glass px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> or <kbd class="glass px-1.5 py-0.5 rounded text-[10px]">,</kbd> to add each skill</p>
        </div>

      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal('modal-barber')" class="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="BarbersCRUD.save()" class="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">Save Barber</button>
      </div>

    </div>
  </div>
</div>
