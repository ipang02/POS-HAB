<div id="pin-screen" class="fixed inset-0 z-[9999] flex items-center justify-center" style="background:#F8F8F6">
  <div class="pin-card w-full max-w-sm mx-4 text-center">

    <!-- Logo / shop name -->
    <div class="mb-8">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.30)">
        <i class="fa-solid fa-scissors text-2xl" style="color:#C9A84C"></i>
      </div>
      <h1 class="text-xl font-bold font-display" style="color:#1F2937">HAB Barbershop</h1>
      <p class="text-xs mt-1" style="color:#9CA3AF">Enter PIN to continue</p>
    </div>

    <!-- PIN dots -->
    <div id="pin-dots" class="flex items-center justify-center gap-4 mb-6">
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:#D1D5DB"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:#D1D5DB"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:#D1D5DB"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:#D1D5DB"></span>
    </div>

    <!-- Error message -->
    <p id="pin-error" class="hidden text-xs font-medium mb-4" style="color:#EF4444">Incorrect PIN. Please try again.</p>

    <!-- Role confirmation (shown briefly on success) -->
    <p id="pin-status" class="hidden text-xs font-semibold mb-4" style="color:#C9A84C"></p>

    <!-- Number pad -->
    <div class="grid grid-cols-3 gap-3 mb-3">
      <?php foreach([1,2,3,4,5,6,7,8,9] as $n): ?>
      <button onclick="Auth.digit(<?= $n ?>)"
        class="pin-btn h-14 rounded-xl text-xl font-semibold transition-all duration-100 active:scale-95"
        style="background:#FFFFFF;border:1px solid #E5E7EB;color:#374151">
        <?= $n ?>
      </button>
      <?php endforeach; ?>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div></div><!-- empty left cell -->
      <button onclick="Auth.digit(0)"
        class="pin-btn h-14 rounded-xl text-xl font-semibold transition-all duration-100 active:scale-95"
        style="background:#FFFFFF;border:1px solid #E5E7EB;color:#374151">
        0
      </button>
      <button onclick="Auth.backspace()"
        class="pin-btn h-14 rounded-xl text-lg transition-all duration-100 active:scale-95"
        style="background:#F3F4F6;border:1px solid #E5E7EB;color:#9CA3AF">
        <i class="fa-solid fa-delete-left"></i>
      </button>
    </div>

  </div>
</div>
