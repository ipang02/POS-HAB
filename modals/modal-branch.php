<!-- ══ MODAL: ADD / EDIT BRANCH ═════════════════════════════ -->
<div id="modal-branch" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-lg">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white" id="branch-modal-title">Add Branch</h3>
          <p class="text-xs text-white/40 mt-0.5" id="branch-modal-sub">New branch appears in the switcher immediately</p>
        </div>
        <button onclick="closeModal('modal-branch')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <input type="hidden" id="branch-edit-id">

      <!-- Avatar Preview -->
      <div class="flex items-center gap-4 glass rounded-2xl p-4 mb-5">
        <div id="branch-avatar-preview"
          class="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white select-none flex-shrink-0"
          style="background:#374151">??</div>
        <div>
          <p class="text-sm font-bold text-white" id="branch-name-preview">Branch Name</p>
          <p class="text-xs text-white/35 mt-0.5" id="branch-addr-preview">Address will appear here</p>
        </div>
      </div>

      <div class="space-y-4">

        <!-- Name + Short Name -->
        <div class="grid grid-cols-3 gap-3">
          <div class="col-span-2">
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Branch Name <span class="text-red-400">*</span></label>
            <input type="text" id="branch-name" placeholder="e.g. Kota Bharu"
              oninput="BranchConfig.updatePreview()" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Short Name <span class="text-red-400">*</span></label>
            <input type="text" id="branch-short" placeholder="KB" maxlength="3"
              oninput="BranchConfig.updatePreview()" class="inp text-center tracking-widest font-bold uppercase">
          </div>
        </div>

        <!-- Phone + Email -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone</label>
            <input type="text" id="branch-phone" placeholder="09-748 1234" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Email</label>
            <input type="email" id="branch-email" placeholder="branch@habbarbershop.com.my" class="inp">
          </div>
        </div>

        <!-- Address -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Address</label>
          <input type="text" id="branch-address" placeholder="Street, postcode, state"
            oninput="BranchConfig.updatePreview()" class="inp">
        </div>

        <!-- Instagram -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Instagram</label>
          <input type="text" id="branch-instagram" placeholder="@habbarbershop.branch" class="inp">
        </div>

        <!-- Business Hours -->
        <div class="border-t border-white/8 pt-4">
          <p class="text-xs font-semibold text-white/45 uppercase tracking-wide mb-3">Business Hours</p>
          <div id="branch-hours-grid" class="space-y-2.5"></div>
        </div>

      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal('modal-branch')" class="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="BranchConfig.save()" class="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">Save Branch</button>
      </div>

    </div>
  </div>
</div>
