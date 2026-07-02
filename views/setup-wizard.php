<!-- ══ SETUP WIZARD OVERLAY ══════════════════════════════════ -->
<div id="setup-wizard" class="hidden fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto py-8" style="background:rgba(0,0,0,0.88)">
  <div class="w-full max-w-lg mx-4">

    <!-- Progress dots -->
    <div class="flex items-center justify-center gap-2 mb-6">
      <?php for($i=1;$i<=7;$i++): ?>
      <div class="wiz-dot w-2.5 h-2.5 rounded-full transition-all duration-300" data-dot="<?= $i ?>"
        style="background:rgba(255,255,255,0.18)"></div>
      <?php endfor; ?>
    </div>

    <!-- Card -->
    <div class="glass rounded-2xl overflow-hidden">

      <!-- ── Step 1: Welcome ── -->
      <div class="wiz-step" data-step="1">
        <div class="px-8 py-10 text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.30)">
            <i class="fa-solid fa-wand-magic-sparkles text-2xl" style="color:#C9A84C"></i>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">Initial Setup</h2>
          <p class="text-sm text-white/50 mb-8">This wizard will clear all demo data and set up the system for your shop.<br>It takes about 2 minutes.</p>
          <p class="text-xs text-white/30 mb-8">You can run this wizard again at any time from Settings → Security.</p>
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Start Setup <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 2: Branch Details ── -->
      <div class="wiz-step hidden" data-step="2">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Branch Details</h3>
          <p class="text-xs text-white/40 mt-0.5">Name, address and phone for your first branch</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label for="wiz-branch-name" class="text-xs text-white/45 mb-1.5 block font-medium">Branch / Shop Name <span class="text-red-400">*</span></label>
            <input type="text" id="wiz-branch-name" placeholder="e.g. HAB Barbershop — Kota Bharu" class="inp"
              oninput="SetupWizard._autoNextReady()">
          </div>
          <div>
            <label for="wiz-address" class="text-xs text-white/45 mb-1.5 block font-medium">Address <span class="text-white/25">(optional)</span></label>
            <input type="text" id="wiz-address" placeholder="e.g. No. 12, Jalan Sultan Yahya Petra" class="inp">
          </div>
          <div>
            <label for="wiz-phone" class="text-xs text-white/45 mb-1.5 block font-medium">Phone <span class="text-white/25">(optional)</span></label>
            <input type="text" id="wiz-phone" inputmode="tel" placeholder="e.g. 09-748 1234" class="inp">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 3: Owner PIN ── -->
      <div class="wiz-step hidden" data-step="3">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Owner PIN</h3>
          <p class="text-xs text-white/40 mt-0.5">4-digit PIN for owner access (full permissions)</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label for="wiz-owner-pin" class="text-xs text-white/45 mb-1.5 block font-medium">New PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-owner-pin" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="••••" class="inp">
          </div>
          <div>
            <label for="wiz-owner-pin-confirm" class="text-xs text-white/45 mb-1.5 block font-medium">Confirm PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-owner-pin-confirm" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="••••" class="inp">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 4: Staff PIN ── -->
      <div class="wiz-step hidden" data-step="4">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Staff PIN</h3>
          <p class="text-xs text-white/40 mt-0.5">4-digit PIN for barber / cashier access (limited permissions)</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label for="wiz-staff-pin" class="text-xs text-white/45 mb-1.5 block font-medium">Staff PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-staff-pin" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="••••" class="inp">
          </div>
          <div>
            <label for="wiz-staff-pin-confirm" class="text-xs text-white/45 mb-1.5 block font-medium">Confirm Staff PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-staff-pin-confirm" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="••••" class="inp">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 5: First Barber ── -->
      <div class="wiz-step hidden" data-step="5">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">First Barber</h3>
          <p class="text-xs text-white/40 mt-0.5">Add the first barber for this branch (you can add more later)</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label for="wiz-barber-name" class="text-xs text-white/45 mb-1.5 block font-medium">Full Name <span class="text-red-400">*</span></label>
            <input type="text" id="wiz-barber-name" placeholder="e.g. Ahmad Razif" class="inp"
              oninput="SetupWizard._onBarberNameInput(this.value)">
          </div>
          <div>
            <label for="wiz-barber-initials" class="text-xs text-white/45 mb-1.5 block font-medium">Initials (max 2 chars)</label>
            <input type="text" id="wiz-barber-initials" maxlength="2" placeholder="AR" class="inp uppercase">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 6: Services ── -->
      <div class="wiz-step hidden" data-step="6">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Services</h3>
          <p class="text-xs text-white/40 mt-0.5">Add your service menu (name &amp; price). At least one required.</p>
        </div>
        <div class="p-6">
          <table class="w-full text-sm mb-3">
            <thead>
              <tr class="text-white/35 text-xs">
                <th class="text-left pb-2 font-medium">Service Name</th>
                <th class="text-left pb-2 font-medium pl-3">Price (RM)</th>
                <th class="w-8"></th>
              </tr>
            </thead>
            <tbody id="wiz-svc-tbody"></tbody>
          </table>
          <button onclick="SetupWizard.addServiceRow()" class="text-xs font-semibold flex items-center gap-1.5 mt-1 transition-opacity hover:opacity-70" style="color:#C9A84C">
            <i class="fa-solid fa-plus text-[10px]"></i> Add service
          </button>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 7: Done ── -->
      <div class="wiz-step hidden" data-step="7">
        <div class="px-8 py-10 text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.30)">
            <i class="fa-solid fa-circle-check text-2xl text-green-400"></i>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">All Done!</h2>
          <p class="text-sm text-white/50 mb-6">Your POS has been set up. Here's a summary:</p>
          <div class="text-left glass rounded-xl p-4 mb-6 space-y-2">
            <p class="text-xs text-white/45">Branch: <span id="wiz-sum-branch" class="text-white font-semibold">—</span></p>
            <p class="text-xs text-white/45">PINs: <span class="text-white font-semibold">Owner &amp; Staff set</span></p>
            <p class="text-xs text-white/45">Barber: <span id="wiz-sum-barber" class="text-white font-semibold">—</span></p>
            <p class="text-xs text-white/45">Services: <span id="wiz-sum-svc-count" class="text-white font-semibold">—</span></p>
          </div>
          <button onclick="SetupWizard.done()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Finish Setup
          </button>
        </div>
      </div>

    </div><!-- /card -->
  </div><!-- /max-w-lg -->
</div><!-- /setup-wizard -->
