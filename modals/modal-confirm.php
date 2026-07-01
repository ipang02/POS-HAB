<!-- ══ MODAL: CONFIRM DIALOG ════════════════════════════════ -->
<div id="modal-confirm" class="modal-overlay hidden" style="z-index:70">
  <div class="modal-box w-full max-w-sm">
    <div class="p-6 text-center">

      <div class="w-14 h-14 rounded-2xl bg-red-500/12 border border-red-500/22 flex items-center justify-center mx-auto mb-4">
        <i class="fa-solid fa-triangle-exclamation text-red-400 text-xl"></i>
      </div>

      <h3 class="text-base font-bold text-white mb-2" id="confirm-title">Are you sure?</h3>
      <p class="text-sm text-white/45 mb-6" id="confirm-msg">This action cannot be undone.</p>

      <div class="flex gap-3">
        <button onclick="closeModal('modal-confirm')"
          class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
        <button id="confirm-yes-btn"
          class="btn-danger flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </div>

    </div>
  </div>
</div>
