<!-- ══ MODAL: PAYMENT ═══════════════════════════════════════ -->
<div id="modal-payment" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-md">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white">Process Payment</h3>
          <p class="text-xs text-white/40 mt-0.5">Select payment method</p>
        </div>
        <button onclick="closeModal('modal-payment')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Order Summary -->
      <div class="glass-gold rounded-xl p-4 mb-5">
        <div class="flex justify-between text-xs text-white/50 mb-1">
          <span>Subtotal</span><span id="pay-subtotal">RM 0</span>
        </div>
        <div class="flex justify-between text-xs text-white/50 mb-1">
          <span>Discount</span><span id="pay-discount" class="text-red-400">−RM 0</span>
        </div>
        <div class="flex justify-between text-xs text-white/50 mb-3">
          <span>Tax</span><span id="pay-tax">RM 0</span>
        </div>
        <div class="flex justify-between font-bold border-t border-white/12 pt-2">
          <span class="text-white text-sm">Total</span>
          <span class="gold-text text-lg" id="pay-total">RM 0</span>
        </div>
      </div>

      <!-- Payment Method Tabs -->
      <div class="flex gap-2 mb-5">
        <button class="tab-btn active flex-1 flex items-center justify-center gap-2 py-2.5" data-method="cash" onclick="POS.selectPayMethod(this)">
          <i class="fa-solid fa-money-bill-wave text-sm"></i> Cash
        </button>
        <button class="tab-btn flex-1 flex items-center justify-center gap-2 py-2.5" data-method="card" onclick="POS.selectPayMethod(this)">
          <i class="fa-solid fa-credit-card text-sm"></i> Card
        </button>
        <button class="tab-btn flex-1 flex items-center justify-center gap-2 py-2.5" data-method="qr" onclick="POS.selectPayMethod(this)">
          <i class="fa-solid fa-qrcode text-sm"></i> QR Pay
        </button>
      </div>

      <!-- Cash Panel -->
      <div id="pay-panel-cash" class="space-y-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Amount Tendered (RM)</label>
          <input type="number" id="cash-tendered" min="0" placeholder="0"
            oninput="POS.calcChange()" class="inp text-lg font-bold text-center py-3">
        </div>
        <div class="glass-gold rounded-xl p-4 flex justify-between items-center">
          <span class="text-sm text-white/60">Change</span>
          <span class="text-xl font-bold text-green-400" id="cash-change">RM 0</span>
        </div>
        <!-- Quick Amount Buttons -->
        <div class="grid grid-cols-4 gap-2">
          <button onclick="POS.quickCash(50000)" class="btn-outline text-xs py-2 rounded-lg">50K</button>
          <button onclick="POS.quickCash(100000)" class="btn-outline text-xs py-2 rounded-lg">100K</button>
          <button onclick="POS.quickCash(150000)" class="btn-outline text-xs py-2 rounded-lg">150K</button>
          <button onclick="POS.quickCash(200000)" class="btn-outline text-xs py-2 rounded-lg">200K</button>
        </div>
      </div>

      <!-- Card Panel -->
      <div id="pay-panel-card" class="hidden space-y-4">
        <div class="glass rounded-xl p-5 text-center">
          <i class="fa-solid fa-credit-card text-4xl text-gold mb-3 block"></i>
          <p class="text-sm text-white font-semibold">Swipe or Insert Card</p>
          <p class="text-xs text-white/40 mt-1">Process payment on card terminal</p>
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Last 4 Digits (optional)</label>
          <input type="text" id="card-last4" maxlength="4" placeholder="•••• •••• •••• XXXX"
            class="inp text-center tracking-widest text-lg">
        </div>
      </div>

      <!-- QR Pay Panel -->
      <div id="pay-panel-qr" class="hidden space-y-4">
        <div class="glass rounded-xl p-5 flex flex-col items-center gap-3">
          <div class="w-44 h-44 bg-white rounded-xl flex items-center justify-center" id="qr-pay-code"></div>
          <p class="text-sm text-white font-semibold">Scan to Pay</p>
          <p class="text-xs text-white/40">QRIS — All e-wallet supported</p>
        </div>
        <div class="flex items-center gap-3 glass-gold rounded-xl px-4 py-3">
          <i class="fa-solid fa-circle-info text-gold"></i>
          <p class="text-xs text-white/60">Ask customer to confirm payment, then click confirm below.</p>
        </div>
      </div>

      <!-- Customer Name -->
      <div class="mt-4">
        <label class="text-xs text-white/45 mb-1.5 block font-medium">Customer Name (optional)</label>
        <input type="text" id="pay-customer-name" placeholder="Walk-in customer" class="inp">
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-5">
        <button onclick="closeModal('modal-payment')" class="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="POS.confirmPayment()" class="btn-gold flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <i class="fa-solid fa-check"></i> Confirm Payment
        </button>
      </div>

    </div>
  </div>
</div>
