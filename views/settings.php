<!-- ══ VIEW: SETTINGS ═══════════════════════════════════════ -->
<section id="view-settings" class="view">

  <div class="max-w-3xl">

    <!-- Section: Branch Management -->
    <div class="card-section mb-5">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl glass-gold flex items-center justify-center">
            <i class="fa-solid fa-code-branch text-gold text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Branch Management</h3>
            <p class="text-xs text-white/35" id="branch-count-lbl">Loading…</p>
          </div>
        </div>
        <button onclick="BranchConfig.openAddModal()" class="btn-gold px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <i class="fa-solid fa-plus text-[11px]"></i> Add Branch
        </button>
      </div>
      <!-- Branch cards -->
      <div id="branch-cards-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4"></div>
    </div>

    <!-- Section: Tax & Currency -->
    <div class="card-section mb-5">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-xl bg-green-500/14 flex items-center justify-center">
          <i class="fa-solid fa-percent text-green-400 text-sm"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Tax & Currency</h3>
          <p class="text-xs text-white/35">Affects all POS calculations</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Tax Rate (%)</label>
          <input type="number" id="set-tax" min="0" max="100" placeholder="11" class="inp">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Currency Symbol</label>
          <input type="text" id="set-currency" placeholder="RM" class="inp">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Low Stock Alert (qty)</label>
          <input type="number" id="set-low-stock" min="1" placeholder="5" class="inp">
        </div>
      </div>
    </div>

    <!-- Business Hours moved into the Branch edit modal -->

    <!-- Section: Receipt -->
    <div class="card-section mb-5">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-xl bg-purple-500/14 flex items-center justify-center">
          <i class="fa-solid fa-receipt text-purple-400 text-sm"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Receipt Customization</h3>
          <p class="text-xs text-white/35">Printed & on-screen receipt</p>
        </div>
      </div>
      <div class="space-y-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Receipt Footer Message</label>
          <textarea id="set-receipt-footer" rows="2" placeholder="Thank you for visiting HAB Barbershop!" class="inp resize-none"></textarea>
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm text-white font-medium">Show QR Code on Receipt</p>
            <p class="text-xs text-white/35">Display feedback/social QR</p>
          </div>
          <label class="tog">
            <input type="checkbox" id="set-receipt-qr" checked>
            <span class="tog-slider"></span>
          </label>
        </div>
        <div class="flex items-center justify-between py-2">
          <div>
            <p class="text-sm text-white font-medium">Show Tax on Receipt</p>
            <p class="text-xs text-white/35">Itemize tax in printed receipt</p>
          </div>
          <label class="tog">
            <input type="checkbox" id="set-receipt-tax" checked>
            <span class="tog-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Section: Theme -->
    <div class="card-section mb-5">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-xl bg-amber-500/14 flex items-center justify-center">
          <i class="fa-solid fa-palette text-amber-400 text-sm"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Appearance</h3>
          <p class="text-xs text-white/35">UI theme preferences</p>
        </div>
      </div>
      <div class="flex items-center justify-between py-2">
        <div>
          <p class="text-sm text-white font-medium">Dark Mode</p>
          <p class="text-xs text-white/35">Premium dark luxury theme</p>
        </div>
        <label class="tog">
          <input type="checkbox" id="set-dark-mode" checked onchange="Settings.toggleTheme(this)">
          <span class="tog-slider"></span>
        </label>
      </div>
    </div>

    <!-- Section: Notifications -->
    <div class="card-section mb-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-xl bg-red-500/14 flex items-center justify-center">
          <i class="fa-solid fa-bell text-red-400 text-sm"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Notifications</h3>
          <p class="text-xs text-white/35">System alert preferences</p>
        </div>
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between py-3 border-b border-white/5">
          <div><p class="text-sm text-white font-medium">New Booking Alert</p><p class="text-xs text-white/35">Notify when appointment is booked</p></div>
          <label class="tog"><input type="checkbox" id="notif-booking" checked><span class="tog-slider"></span></label>
        </div>
        <div class="flex items-center justify-between py-3 border-b border-white/5">
          <div><p class="text-sm text-white font-medium">Low Stock Alert</p><p class="text-xs text-white/35">Alert when inventory is running low</p></div>
          <label class="tog"><input type="checkbox" id="notif-stock" checked><span class="tog-slider"></span></label>
        </div>
        <div class="flex items-center justify-between py-3 border-b border-white/5">
          <div><p class="text-sm text-white font-medium">Payment Notification</p><p class="text-xs text-white/35">Confirm each successful payment</p></div>
          <label class="tog"><input type="checkbox" id="notif-payment" checked><span class="tog-slider"></span></label>
        </div>
        <div class="flex items-center justify-between py-3">
          <div><p class="text-sm text-white font-medium">Daily Summary</p><p class="text-xs text-white/35">End-of-day revenue report</p></div>
          <label class="tog"><input type="checkbox" id="notif-daily"><span class="tog-slider"></span></label>
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex gap-3">
      <button onclick="Settings.save()" class="btn-gold px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
        <i class="fa-solid fa-floppy-disk"></i> Save Settings
      </button>
      <button onclick="Settings.load()" class="btn-outline px-6 py-3 rounded-xl text-sm font-semibold">
        Reset
      </button>
    </div>

  </div>
</section>
