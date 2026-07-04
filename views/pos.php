<!-- ══ VIEW: POS CASHIER ════════════════════════════════════ -->
<section id="view-pos" class="view">

  <div class="flex gap-5 pos-layout" style="min-height:calc(100vh - 148px)">

    <!-- ── Left: Services & Products Panel ───────────────────── -->
    <div class="flex-1 flex flex-col min-w-0">

      <!-- Top controls row -->
      <div class="flex gap-3 mb-4">
        <!-- Services / Products tab switcher -->
        <div class="flex gap-1 glass rounded-xl p-1 flex-shrink-0">
          <button id="pos-tab-services" class="tab-btn active flex items-center gap-1.5 px-4 py-2"
            onclick="POS.switchPanel('services', this)">
            <i class="fa-solid fa-scissors text-[11px]"></i>
            <span class="text-sm">Services</span>
          </button>
          <button id="pos-tab-products" class="tab-btn flex items-center gap-1.5 px-4 py-2"
            onclick="POS.switchPanel('products', this)">
            <i class="fa-solid fa-box text-[11px]"></i>
            <span class="text-sm">Products</span>
          </button>
        </div>
        <!-- Search (shared) -->
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
          <input type="text" id="svc-search" placeholder="Search… (press /)"
            oninput="POS.handleSearch()" class="inp pl-9 py-2.5 text-sm">
        </div>
        <!-- Barber selector -->
        <select id="pos-barber" class="sel py-2.5 text-sm" style="width:180px">
          <option value="">Select Barber</option>
        </select>
      </div>

      <!-- ── SERVICES PANEL ─────────────────────────────────── -->
      <div id="pos-panel-services" class="flex flex-col flex-1 min-h-0">
        <!-- Category Filter Tabs -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <button class="tab-btn active" data-cat="all" onclick="POS.filterByCategory(this)">
            <i class="fa-solid fa-border-all mr-1.5 text-[11px]"></i>All
          </button>
          <button class="tab-btn" data-cat="hair" onclick="POS.filterByCategory(this)">
            <i class="fa-solid fa-scissors mr-1.5 text-[11px]"></i>Hair
          </button>
          <button class="tab-btn" data-cat="beard" onclick="POS.filterByCategory(this)">
            <i class="fa-solid fa-face-grin-beam mr-1.5 text-[11px]"></i>Beard
          </button>
          <button class="tab-btn" data-cat="treatment" onclick="POS.filterByCategory(this)">
            <i class="fa-solid fa-spa mr-1.5 text-[11px]"></i>Treatment
          </button>
          <button class="tab-btn" data-cat="package" onclick="POS.filterByCategory(this)">
            <i class="fa-solid fa-crown mr-1.5 text-[11px]"></i>Packages
          </button>
        </div>
        <!-- Service Grid -->
        <div id="service-grid" class="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 content-start pb-4"></div>
      </div>

      <!-- ── PRODUCTS PANEL ─────────────────────────────────── -->
      <div id="pos-panel-products" class="hidden flex flex-col flex-1 min-h-0">
        <!-- Product Category Filter -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <button class="tab-btn active" data-pcat="all" onclick="POS.filterProductCat(this)">All</button>
          <button class="tab-btn" data-pcat="styling" onclick="POS.filterProductCat(this)">Styling</button>
          <button class="tab-btn" data-pcat="haircare" onclick="POS.filterProductCat(this)">Hair Care</button>
          <button class="tab-btn" data-pcat="shaving" onclick="POS.filterProductCat(this)">Shaving</button>
          <button class="tab-btn" data-pcat="tools" onclick="POS.filterProductCat(this)">Tools</button>
          <button class="tab-btn" data-pcat="beard" onclick="POS.filterProductCat(this)">Beard Care</button>
        </div>
        <!-- Product Grid -->
        <div id="product-grid" class="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 content-start pb-4"></div>
      </div>

    </div>

    <!-- ── Right: Cart Panel ──────────────────────────────────── -->
    <div class="w-[320px] pos-cart-panel flex flex-col glass rounded-2xl overflow-hidden"
      style="max-height:calc(100vh - 148px)">

      <!-- Cart Header -->
      <div class="px-5 py-4 border-b border-white/6 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-white">Order Cart</h3>
            <p class="text-xs text-white/35 mt-0.5" id="cart-count-lbl">0 items selected</p>
          </div>
          <button onclick="POS.clearCart()"
            class="text-xs text-white/22 hover:text-red-400 transition-colors flex items-center gap-1">
            <i class="fa-solid fa-trash-can"></i> Clear
          </button>
        </div>
      </div>

      <!-- Cart Items List -->
      <div id="cart-items" class="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 min-h-0"></div>

      <!-- Empty Cart State -->
      <div id="cart-empty" class="flex flex-col items-center justify-center text-center px-6 py-10 flex-1">
        <div class="w-16 h-16 rounded-2xl glass-gold flex items-center justify-center mb-3">
          <i class="fa-solid fa-cart-shopping text-gold text-2xl"></i>
        </div>
        <p class="text-sm font-semibold text-white/50">Cart is empty</p>
        <p class="text-xs text-white/22 mt-1">Tap a service or product</p>
      </div>

      <!-- Totals & Pay -->
      <div class="px-5 py-4 border-t border-white/6 space-y-2.5 flex-shrink-0">

        <!-- Booking Fee -->
        <div class="flex items-center justify-between">
          <label class="text-xs text-white/40">Booking Fee</label>
          <button id="btn-booking-fee" onclick="POS.toggleBookingFee()"
            class="text-xs px-3 py-1 rounded-lg border transition-colors font-semibold"
            style="border-color:rgba(255,255,255,.12);color:rgba(255,255,255,.35)">
            + Add
          </button>
        </div>

        <!-- Discount -->
        <div class="flex items-center gap-2">
          <label class="text-xs text-white/40 w-20 flex-shrink-0">Discount %</label>
          <input type="number" id="pos-discount" min="0" max="100" value="0"
            oninput="POS.recalc()" class="inp text-center text-sm py-1.5"
            style="width:58px; padding-left:6px; padding-right:6px;">
          <div class="flex-1 text-right">
            <span class="text-xs text-white/30">Saved: </span>
            <span class="text-xs text-red-400 font-semibold" id="pos-disc-amt">RM 0</span>
          </div>
        </div>

        <div class="flex justify-between text-xs text-white/38">
          <span>Subtotal</span>
          <span id="pos-subtotal">RM 0</span>
        </div>
        <div class="flex justify-between text-xs text-white/38">
          <span>Tax (<span id="pos-tax-pct">6</span>% SST)</span>
          <span id="pos-tax-amt">RM 0</span>
        </div>
        <div id="pos-booking-fee-row" class="flex justify-between text-xs text-white/38 hidden">
          <span>Booking Fee</span>
          <span id="pos-booking-fee-amt">RM 0</span>
        </div>

        <div class="flex justify-between items-center border-t border-white/8 pt-3">
          <span class="text-base font-bold text-white">Total</span>
          <span class="text-lg font-bold gold-text" id="pos-total">RM 0</span>
        </div>

        <button id="btn-pay" onclick="POS.openPayment()" disabled
          class="btn-gold w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <i class="fa-solid fa-credit-card"></i> Process Payment
        </button>

      </div>
    </div><!-- /cart -->

  </div>
</section>
