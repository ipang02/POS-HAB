<!-- ══ MODAL: ADD / EDIT SERVICE ════════════════════════════ -->
<div id="modal-service" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-md">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white" id="svc-modal-title">Add Service</h3>
          <p class="text-xs text-white/40 mt-0.5" id="svc-modal-sub">Fill in the service details</p>
        </div>
        <button onclick="closeModal('modal-service')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <input type="hidden" id="svc-edit-id">

      <div class="space-y-4">

        <!-- Name -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Service Name <span class="text-red-400">*</span></label>
          <input type="text" id="svc-name" placeholder="e.g. Premium Haircut" class="inp">
        </div>

        <!-- Price & Duration -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Price (RM) <span class="text-red-400">*</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">RM</span>
              <input type="number" id="svc-price" min="0" step="0.50" placeholder="0"
                class="inp pl-10">
            </div>
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Duration (min) <span class="text-red-400">*</span></label>
            <div class="relative">
              <input type="number" id="svc-duration" min="5" step="5" placeholder="30" class="inp pr-10">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">min</span>
            </div>
          </div>
        </div>

        <!-- Category & Icon -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Category <span class="text-red-400">*</span></label>
            <select id="svc-cat" class="sel">
              <option value="hair">Hair</option>
              <option value="beard">Beard</option>
              <option value="treatment">Treatment</option>
              <option value="package">Package</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Icon</label>
            <select id="svc-icon" class="sel" onchange="ServicesMgmt.previewIcon(this.value)">
              <option value="fa-scissors">✂ Scissors</option>
              <option value="fa-face-grin-beam">😀 Beard</option>
              <option value="fa-shower">🚿 Shower</option>
              <option value="fa-palette">🎨 Palette</option>
              <option value="fa-child">👦 Child</option>
              <option value="fa-fire-flame-curved">🔥 Flame</option>
              <option value="fa-spa">🌿 Spa</option>
              <option value="fa-crown">👑 Crown</option>
              <option value="fa-eye">👁 Eye</option>
              <option value="fa-wind">💨 Wind</option>
              <option value="fa-star">⭐ Star</option>
              <option value="fa-wand-magic-sparkles">✨ Magic</option>
            </select>
          </div>
        </div>

        <!-- Icon Preview -->
        <div class="flex items-center gap-3 glass rounded-xl p-3">
          <div class="w-10 h-10 rounded-xl glass-gold flex items-center justify-center flex-shrink-0">
            <i id="svc-icon-preview" class="fa-solid fa-scissors text-gold text-lg"></i>
          </div>
          <div>
            <p class="text-xs text-white/50">Icon preview</p>
            <p class="text-sm font-semibold text-white" id="svc-name-preview">Service Name</p>
          </div>
          <div class="ml-auto text-right">
            <p class="text-xs text-white/50">Price</p>
            <p class="text-sm font-bold gold-text" id="svc-price-preview">RM 0</p>
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Description <span class="text-white/25">(optional)</span></label>
          <input type="text" id="svc-desc" placeholder="Short description shown in POS" class="inp">
        </div>

        <!-- Active Toggle -->
        <div class="flex items-center justify-between py-2 border-t border-white/6 pt-4">
          <div>
            <p class="text-sm text-white font-medium">Visible in POS Cashier</p>
            <p class="text-xs text-white/35">Toggle off to hide this service from the cashier screen</p>
          </div>
          <label class="tog">
            <input type="checkbox" id="svc-active" checked>
            <span class="tog-slider"></span>
          </label>
        </div>

      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-5">
        <button onclick="closeModal('modal-service')" class="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="ServicesMgmt.save()" class="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">Save Service</button>
      </div>

    </div>
  </div>
</div>
