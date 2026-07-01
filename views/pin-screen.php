<div id="pin-screen" class="fixed inset-0 z-[9999] flex items-center justify-center" style="background:rgba(15,15,20,0.97);backdrop-filter:blur(20px)">
  <div class="pin-card w-full max-w-sm mx-4 text-center">

    <!-- Logo / shop name -->
    <div class="mb-8">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.25)">
        <i class="fa-solid fa-scissors text-2xl" style="color:#C9A84C"></i>
      </div>
      <h1 class="text-xl font-bold text-white font-display">HAB Barbershop</h1>
      <p class="text-xs text-white/35 mt-1">Enter PIN to continue</p>
    </div>

    <!-- PIN dots -->
    <div id="pin-dots" class="flex items-center justify-center gap-4 mb-6">
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
    </div>

    <!-- Error message -->
    <p id="pin-error" class="hidden text-xs font-medium mb-4" style="color:#f87171">Incorrect PIN. Please try again.</p>

    <!-- Role confirmation (shown briefly on success) -->
    <p id="pin-status" class="hidden text-xs font-semibold mb-4" style="color:#C9A84C"></p>

    <!-- Number pad -->
    <div class="grid grid-cols-3 gap-3 mb-3">
      <?php foreach([1,2,3,4,5,6,7,8,9] as $n): ?>
      <button onclick="Auth.digit(<?= $n ?>)"
        class="pin-btn h-14 rounded-xl text-xl font-semibold text-white transition-all duration-100 active:scale-95"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08)">
        <?= $n ?>
      </button>
      <?php endforeach; ?>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div></div><!-- empty left cell -->
      <button onclick="Auth.digit(0)"
        class="pin-btn h-14 rounded-xl text-xl font-semibold text-white transition-all duration-100 active:scale-95"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08)">
        0
      </button>
      <button onclick="Auth.backspace()"
        class="pin-btn h-14 rounded-xl text-lg text-white/50 transition-all duration-100 active:scale-95"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
        <i class="fa-solid fa-delete-left"></i>
      </button>
    </div>

  </div>
</div>
