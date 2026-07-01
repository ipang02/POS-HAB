<!-- ══ MODAL: APPOINTMENT BOOKING ══════════════════════════ -->
<div id="modal-appt" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-lg">
    <div class="p-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white" id="appt-modal-title">Book Appointment</h3>
          <p class="text-xs text-white/40 mt-0.5" id="appt-modal-sub">Fill in the details below</p>
        </div>
        <button onclick="closeModal('modal-appt')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <input type="hidden" id="appt-edit-id">

      <div class="space-y-4">

        <!-- Customer Name -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Customer Name <span class="text-red-400">*</span></label>
          <input type="text" id="appt-customer" placeholder="e.g. Budi Santoso" class="inp">
        </div>

        <!-- Phone -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone Number</label>
          <input type="text" id="appt-phone" placeholder="08xxxxxxxxxx" class="inp">
        </div>

        <!-- Service & Barber -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Service <span class="text-red-400">*</span></label>
            <select id="appt-service" class="sel" onchange="Appointments.updateDuration()">
              <option value="">Select service</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Barber <span class="text-red-400">*</span></label>
            <select id="appt-barber" class="sel">
              <option value="">Select barber</option>
            </select>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Date <span class="text-red-400">*</span></label>
            <input type="date" id="appt-date" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Time <span class="text-red-400">*</span></label>
            <select id="appt-time" class="sel">
              <option value="09:00">09:00</option>
              <option value="09:30">09:30</option>
              <option value="10:00">10:00</option>
              <option value="10:30">10:30</option>
              <option value="11:00">11:00</option>
              <option value="11:30">11:30</option>
              <option value="12:00">12:00</option>
              <option value="12:30">12:30</option>
              <option value="13:00">13:00</option>
              <option value="13:30">13:30</option>
              <option value="14:00">14:00</option>
              <option value="14:30">14:30</option>
              <option value="15:00">15:00</option>
              <option value="15:30">15:30</option>
              <option value="16:00">16:00</option>
              <option value="16:30">16:30</option>
              <option value="17:00">17:00</option>
              <option value="17:30">17:30</option>
              <option value="18:00">18:00</option>
              <option value="18:30">18:30</option>
              <option value="19:00">19:00</option>
              <option value="19:30">19:30</option>
              <option value="20:00">20:00</option>
            </select>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Status</label>
          <select id="appt-status" class="sel">
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Notes (optional)</label>
          <textarea id="appt-notes" rows="2" placeholder="Special requests or preferences…" class="inp resize-none"></textarea>
        </div>

      </div>

      <!-- Duration Info -->
      <div id="appt-duration-info" class="hidden mt-4 flex items-center gap-2 glass-gold rounded-xl px-4 py-2.5">
        <i class="fa-regular fa-clock text-gold text-sm"></i>
        <span class="text-xs text-white/60">Estimated duration: <span class="text-gold font-semibold" id="appt-duration-lbl">—</span></span>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 mt-5">
        <button onclick="closeModal('modal-appt')" class="btn-outline flex-1 py-3 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="Appointments.save()" class="btn-gold flex-1 py-3 rounded-xl text-sm font-bold">
          Save Appointment
        </button>
      </div>

    </div>
  </div>
</div>

<!-- ══ MODAL: APPOINTMENT DETAIL ════════════════════════════ -->
<div id="modal-appt-detail" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-sm">
    <div class="p-6">

      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-white">Appointment Detail</h3>
        <button onclick="closeModal('modal-appt-detail')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <div id="appt-detail-body" class="space-y-3 mb-5"></div>

      <!-- Status Actions -->
      <div class="space-y-2">
        <p class="text-xs text-white/35 font-medium uppercase tracking-wide">Change Status</p>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="Appointments.changeStatus('confirmed')"
            class="py-2 rounded-xl text-xs font-semibold border border-blue-400/30 bg-blue-400/10 text-blue-400 hover:bg-blue-400/18 transition-colors">
            Confirmed
          </button>
          <button onclick="Appointments.changeStatus('completed')"
            class="py-2 rounded-xl text-xs font-semibold border border-green-400/30 bg-green-400/10 text-green-400 hover:bg-green-400/18 transition-colors">
            Completed
          </button>
          <button onclick="Appointments.changeStatus('pending')"
            class="py-2 rounded-xl text-xs font-semibold border border-amber-400/30 bg-amber-400/10 text-amber-400 hover:bg-amber-400/18 transition-colors">
            Pending
          </button>
          <button onclick="Appointments.changeStatus('cancelled')"
            class="py-2 rounded-xl text-xs font-semibold border border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/18 transition-colors">
            Cancelled
          </button>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button onclick="Appointments.editFromDetail()" class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">
          <i class="fa-solid fa-pen mr-1"></i> Edit
        </button>
        <button onclick="Appointments.deleteFromDetail()" class="btn-danger flex-1 py-2.5 rounded-xl text-sm font-semibold">
          <i class="fa-solid fa-trash mr-1"></i> Delete
        </button>
      </div>

    </div>
  </div>
</div>
