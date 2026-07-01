<!-- ══ MODAL: RECEIPT ═══════════════════════════════════════ -->
<div id="modal-receipt-overlay" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-sm">
    <div class="p-6">

      <!-- Actions (no-print) -->
      <div class="flex items-center justify-between mb-4 no-print">
        <h3 class="text-base font-bold text-white">Receipt</h3>
        <div class="flex gap-2">
          <button onclick="POS.printReceipt()" class="btn-outline flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
            <i class="fa-solid fa-print text-gold"></i> Print
          </button>
          <button onclick="closeModal('modal-receipt-overlay'); POS.newOrder();"
            class="btn-gold px-4 py-2 rounded-xl text-sm font-bold">
            New Order
          </button>
        </div>
      </div>

      <!-- Receipt Body -->
      <div id="receipt-content" class="text-center">

        <!-- Shop Header -->
        <div class="mb-4">
          <div class="w-14 h-14 rounded-2xl btn-gold flex items-center justify-center mx-auto mb-2 text-sm font-bold">HAB</div>
          <h2 class="font-display font-bold text-white text-lg" id="rcpt-shop-name">HAB Barbershop</h2>
          <p class="text-xs text-white/40" id="rcpt-address">Jl. Sudirman No. 45, Jakarta</p>
          <p class="text-xs text-white/40" id="rcpt-phone">021-12345678</p>
        </div>

        <div class="divider my-3"></div>

        <!-- Transaction Info -->
        <div class="text-left space-y-1 mb-3">
          <div class="flex justify-between text-xs">
            <span class="text-white/40">Receipt No.</span>
            <span class="text-white font-mono font-semibold" id="rcpt-id">—</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-white/40">Date & Time</span>
            <span class="text-white font-semibold" id="rcpt-datetime">—</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-white/40">Customer</span>
            <span class="text-white font-semibold" id="rcpt-customer">Walk-in</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-white/40">Barber</span>
            <span class="text-white font-semibold" id="rcpt-barber">—</span>
          </div>
        </div>

        <div class="divider my-3"></div>

        <!-- Items -->
        <div id="rcpt-items" class="space-y-1.5 mb-3 text-left"></div>

        <div class="divider my-3"></div>

        <!-- Totals -->
        <div class="space-y-1 mb-3">
          <div class="flex justify-between text-xs">
            <span class="text-white/40">Subtotal</span>
            <span class="text-white" id="rcpt-subtotal">RM 0</span>
          </div>
          <div class="flex justify-between text-xs" id="rcpt-disc-row">
            <span class="text-white/40">Discount</span>
            <span class="text-red-400" id="rcpt-discount">−RM 0</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-white/40">Tax</span>
            <span class="text-white" id="rcpt-tax">RM 0</span>
          </div>
          <div class="flex justify-between font-bold mt-2 pt-2 border-t border-white/8">
            <span class="text-white">TOTAL</span>
            <span class="gold-text text-base" id="rcpt-total">RM 0</span>
          </div>
          <div class="flex justify-between text-xs mt-1">
            <span class="text-white/40">Payment Method</span>
            <span class="text-white font-semibold" id="rcpt-method">—</span>
          </div>
          <div class="flex justify-between text-xs" id="rcpt-change-row">
            <span class="text-white/40">Change</span>
            <span class="text-green-400 font-semibold" id="rcpt-change">RM 0</span>
          </div>
        </div>

        <div class="divider my-3"></div>

        <!-- QR Code -->
        <div id="rcpt-qr-wrap">
          <div id="rcpt-qr" class="w-28 h-28 bg-white rounded-xl flex items-center justify-center mx-auto mb-2"></div>
          <p class="text-[10px] text-white/30">Scan for feedback</p>
        </div>

        <div class="divider my-3"></div>

        <!-- Footer -->
        <p class="text-xs text-white/40 italic" id="rcpt-footer">Thank you for visiting HAB Barbershop!</p>
        <p class="text-[10px] text-white/20 mt-2">Powered by HAB POS System</p>

      </div>
    </div>
  </div>
</div>

<!-- Hidden Print Area -->
<div id="print-receipt"></div>
