// ============================================================
// HAB Barbershop POS — Appointments Module
// ============================================================

const Appointments = {
  weekOffset: 0,
  detailId: null,

  init() {
    this.populateDropdowns();
    this.renderCalendar();
    this.renderList();
  },

  populateDropdowns() {
    const svcSel    = document.getElementById('appt-service');
    const barSel    = document.getElementById('appt-barber');
    const filterBar = document.getElementById('appt-filter-barber');
    const bBarbers  = branchBarbers();

    if (svcSel) {
      svcSel.innerHTML = '<option value="">Select service</option>' +
        AppData.services.filter(s => s.is_active !== false).map(s => `<option value="${s.id}">${s.name} — ${formatRp(s.price)}</option>`).join('');
    }
    if (barSel) {
      barSel.innerHTML = '<option value="">Select barber</option>' +
        bBarbers.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
    if (filterBar) {
      filterBar.innerHTML = '<option value="all">All Barbers</option>' +
        bBarbers.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
    }
  },

  // ── Calendar ────────────────────────────────────────────────
  renderCalendar() {
    const grid = document.getElementById('cal-grid');
    if (!grid) return;

    const today = new Date();
    today.setDate(today.getDate() + this.weekOffset * 7);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Monday

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday); d.setDate(monday.getDate() + i);
      return d;
    });

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd   = days[6].toISOString().split('T')[0];
    const labelEl = document.getElementById('cal-week-label');
    const subEl   = document.getElementById('cal-week-sub');
    if (labelEl) labelEl.textContent = `${monday.toLocaleDateString('en',{month:'short',day:'numeric'})} — ${days[6].toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}`;
    if (subEl) subEl.textContent = `${branchAppointments().filter(a => a.date >= weekStart && a.date <= weekEnd).length} appointments this week`;

    const hours = Array.from({ length: 13 }, (_, i) => 8 + i); // 08-20

    let html = `<div style="display:grid;grid-template-columns:56px repeat(7,1fr)">`;

    // Header row
    html += `<div class="h-12 border-b border-r border-white/6 flex items-center justify-center"><span class="text-[10px] text-white/25">TIME</span></div>`;
    days.forEach(d => {
      const ds   = d.toISOString().split('T')[0];
      const isToday = ds === new Date().toISOString().split('T')[0];
      html += `<div class="h-12 border-b border-r border-white/6 flex flex-col items-center justify-center px-1 ${isToday ? 'bg-gold/6' : ''}">
        <span class="text-[10px] font-bold ${isToday ? 'text-gold' : 'text-white/40'} uppercase tracking-wide">${d.toLocaleDateString('en',{weekday:'short'})}</span>
        <span class="text-xs font-bold ${isToday ? 'text-gold' : 'text-white'} mt-0.5">${d.getDate()}</span>
      </div>`;
    });

    // Time rows
    hours.forEach(h => {
      const timeStr = String(h).padStart(2,'0') + ':00';
      html += `<div class="h-14 border-b border-r border-white/6 flex items-start justify-center pt-1.5">
        <span class="text-[10px] font-mono text-white/22">${timeStr}</span>
      </div>`;
      days.forEach(d => {
        const ds = d.toISOString().split('T')[0];
        const appts = branchAppointments().filter(a => a.date === ds && a.time === timeStr);
        let inner = '';
        appts.forEach(a => {
          const barber = getBarberById(a.barberId);
          const colors = { pending:'rgba(245,158,11,.7)', confirmed:'rgba(59,130,246,.7)', completed:'rgba(34,197,94,.7)', cancelled:'rgba(239,68,68,.5)' };
          inner += `<div class="appt-block" style="background:${colors[a.status]||colors.pending};color:#fff"
            onclick="Appointments.openDetail(${a.id})" title="${a.customer}">
            <div class="font-semibold truncate">${a.customer}</div>
            <div class="text-[9px] opacity-75 truncate">${barber ? barber.name : ''}</div>
          </div>`;
        });
        html += `<div class="cal-cell" onclick="Appointments.clickSlot('${ds}','${timeStr}',event)">${inner}</div>`;
      });
    });

    html += '</div>';
    grid.innerHTML = html;
  },

  clickSlot(date, time, e) {
    if (e.target.closest('.appt-block')) return; // handled by block click
    this.openBookingModal(date, time);
  },

  prevWeek() { this.weekOffset--; this.renderCalendar(); },
  nextWeek() { this.weekOffset++; this.renderCalendar(); },
  goToday()  { this.weekOffset = 0; this.renderCalendar(); },

  // ── List ─────────────────────────────────────────────────────
  renderList() {
    const tbody  = document.getElementById('appt-list-tbody');
    const emptyEl = document.getElementById('appt-list-empty');
    const subEl   = document.getElementById('appt-list-sub');
    if (!tbody) return;

    const statusFilter = document.getElementById('appt-filter-status')?.value || 'all';
    const barberFilter = document.getElementById('appt-filter-barber')?.value || 'all';
    const t = today();

    let appts = branchAppointments().filter(a => a.date === t);
    if (statusFilter !== 'all') appts = appts.filter(a => a.status === statusFilter);
    if (barberFilter !== 'all') appts = appts.filter(a => a.barberId == barberFilter);
    appts.sort((a, b) => a.time.localeCompare(b.time));

    if (subEl) subEl.textContent = `${appts.length} appointment${appts.length !== 1 ? 's' : ''} today`;
    tbody.classList.toggle('hidden', appts.length === 0);
    emptyEl.classList.toggle('hidden', appts.length > 0);

    tbody.innerHTML = appts.map(a => {
      const barber  = getBarberById(a.barberId);
      const service = getServiceById(a.serviceId);
      return `
        <tr class="hover:bg-white/2 transition-colors">
          <td class="py-2.5 pr-4">
            <span class="text-sm font-mono font-semibold text-white">${formatTime12(a.time)}</span>
          </td>
          <td class="py-2.5 pr-4">
            <div class="text-sm font-semibold text-white">${a.customer}</div>
            ${a.phone ? `<div class="text-xs text-white/35">${a.phone}</div>` : ''}
          </td>
          <td class="py-2.5 pr-4 text-sm text-white/60">${service ? service.name : '—'}</td>
          <td class="py-2.5 pr-4 hidden md:table-cell text-sm text-white/60">${barber ? barber.name : '—'}</td>
          <td class="py-2.5 pr-4">
            <span class="badge badge-${a.status}">${statusLabel(a.status)}</span>
          </td>
          <td class="py-2.5 text-right">
            <div class="flex items-center justify-end gap-1.5">
              ${(a.status === 'confirmed' || a.status === 'completed') ? `
              <button onclick="Appointments.processPayment(${a.id})"
                class="btn-gold h-7 px-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold" title="Process payment">
                <i class="fa-solid fa-cash-register text-[10px]"></i>
                <span class="hidden sm:inline">Pay</span>
              </button>` : ''}
              <button onclick="Appointments.openDetail(${a.id})" class="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center text-xs">
                <i class="fa-solid fa-eye"></i>
              </button>
              <button onclick="Appointments.editById(${a.id})" class="btn-ghost w-7 h-7 rounded-lg flex items-center justify-center text-xs">
                <i class="fa-solid fa-pen"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
  },

  // ── Booking Modal ─────────────────────────────────────────────
  openBookingModal(date = null, time = null) {
    document.getElementById('appt-edit-id').value = '';
    document.getElementById('appt-modal-title').textContent = 'Book Appointment';
    document.getElementById('appt-modal-sub').textContent   = 'Fill in the details below';
    document.getElementById('appt-customer').value = '';
    document.getElementById('appt-phone').value    = '';
    document.getElementById('appt-service').value  = '';
    document.getElementById('appt-barber').value   = '';
    document.getElementById('appt-date').value     = date || today();
    document.getElementById('appt-time').value     = time || '09:00';
    document.getElementById('appt-status').value   = 'pending';
    document.getElementById('appt-notes').value    = '';
    document.getElementById('appt-duration-info').classList.add('hidden');
    openModal('modal-appt');
    this.updateEffectivePrice();
  },

  editById(id) {
    const a = AppData.appointments.find(x => x.id === id);
    if (!a) return;
    document.getElementById('appt-edit-id').value  = id;
    document.getElementById('appt-modal-title').textContent = 'Edit Appointment';
    document.getElementById('appt-modal-sub').textContent   = 'Update appointment details';
    document.getElementById('appt-customer').value = a.customer;
    document.getElementById('appt-phone').value    = a.phone || '';
    document.getElementById('appt-service').value  = a.serviceId;
    document.getElementById('appt-barber').value   = a.barberId;
    document.getElementById('appt-date').value     = a.date;
    document.getElementById('appt-time').value     = a.time;
    document.getElementById('appt-status').value   = a.status;
    document.getElementById('appt-notes').value    = a.notes || '';
    this.updateDuration();
    this.updateEffectivePrice();
    openModal('modal-appt');
  },

  updateDuration() {
    const svcId = parseInt(document.getElementById('appt-service')?.value);
    const svc   = getServiceById(svcId);
    const infoEl = document.getElementById('appt-duration-info');
    const lblEl  = document.getElementById('appt-duration-lbl');
    if (svc && infoEl && lblEl) {
      infoEl.classList.remove('hidden');
      lblEl.textContent = svc.duration + ' minutes';
    } else if (infoEl) {
      infoEl.classList.add('hidden');
    }
  },

  updateEffectivePrice() {
    const svcId  = parseInt(document.getElementById('appt-service')?.value);
    const barbId = parseInt(document.getElementById('appt-barber')?.value);
    const svc    = getServiceById(svcId);
    const barb   = getBarberById(barbId);
    const priceEl = document.getElementById('appt-effective-price');
    const valEl   = document.getElementById('appt-effective-price-val');
    if (!priceEl || !valEl) return;
    if (!svc) { priceEl.classList.add('hidden'); return; }
    valEl.textContent = formatRp(resolveBookingPrice(svc, barb));
    priceEl.classList.remove('hidden');
  },

  save() {
    const customer = document.getElementById('appt-customer').value.trim();
    const serviceId = parseInt(document.getElementById('appt-service').value);
    const barberId  = parseInt(document.getElementById('appt-barber').value);
    const date      = document.getElementById('appt-date').value;
    const time      = document.getElementById('appt-time').value;
    const status    = document.getElementById('appt-status').value;

    if (!customer) { showToast('Customer name is required', 'error'); return; }
    if (!serviceId){ showToast('Please select a service', 'error'); return; }
    if (!barberId) { showToast('Please select a barber', 'error'); return; }
    if (!date)     { showToast('Please select a date', 'error'); return; }

    const editId = parseInt(document.getElementById('appt-edit-id').value);

    const svc  = getServiceById(serviceId);
    const barb = getBarberById(barberId);
    const bookedPrice = svc ? resolveBookingPrice(svc, barb) : 0;

    if (editId) {
      const idx = AppData.appointments.findIndex(a => a.id === editId);
      if (idx > -1) {
        AppData.appointments[idx] = { ...AppData.appointments[idx], customer, serviceId, barberId, date, time, status,
          phone: document.getElementById('appt-phone').value,
          notes: document.getElementById('appt-notes').value,
          bookedPrice };
        showToast('Appointment updated', 'success');
      }
    } else {
      AppData.appointments.push({
        id: nextNumId(AppData.appointments), customer, serviceId, barberId, date, time, status,
        phone: document.getElementById('appt-phone').value,
        notes: document.getElementById('appt-notes').value,
        branchId: App.currentBranch || 1,
        bookedPrice
      });
      showToast('Appointment booked!', 'success');
    }

    AppData.save('appointments');

    // Link appointment to customer profile by phone
    const apptPhone = document.getElementById('appt-phone').value.trim();
    if (apptPhone) Customers.findOrCreate(customer, apptPhone);

    closeModal('modal-appt');
    this.renderCalendar();
    this.renderList();

    // Update pending badge
    const pending = branchAppointments().filter(a => a.status === 'pending').length;
    const badge = document.getElementById('nav-appt-badge');
    if (badge) { badge.textContent = pending; badge.classList.toggle('hidden', pending === 0); }
  },

  // ── Detail Modal ──────────────────────────────────────────────
  openDetail(id) {
    const a = AppData.appointments.find(x => x.id === id);
    if (!a) return;
    this.detailId = id;
    const barber  = getBarberById(a.barberId);
    const service = getServiceById(a.serviceId);

    const body = document.getElementById('appt-detail-body');
    body.innerHTML = `
      <div class="glass rounded-xl p-4 space-y-2.5">
        <div class="flex justify-between text-sm"><span class="text-white/45">Customer</span><span class="text-white font-semibold">${a.customer}</span></div>
        ${a.phone ? `<div class="flex justify-between text-sm"><span class="text-white/45">Phone</span><span class="text-white">${a.phone}</span></div>` : ''}
        <div class="flex justify-between text-sm"><span class="text-white/45">Service</span><span class="text-white font-semibold">${service ? service.name : '—'}</span></div>
        <div class="flex justify-between text-sm"><span class="text-white/45">Barber</span><span class="text-white">${barber ? barber.name : '—'}</span></div>
        <div class="flex justify-between text-sm"><span class="text-white/45">Date</span><span class="text-white">${formatDate(a.date)}</span></div>
        <div class="flex justify-between text-sm"><span class="text-white/45">Time</span><span class="text-white font-semibold">${formatTime12(a.time)}</span></div>
        <div class="flex justify-between text-sm"><span class="text-white/45">Status</span><span class="badge badge-${a.status}">${statusLabel(a.status)}</span></div>
        ${a.notes ? `<div class="flex justify-between text-sm"><span class="text-white/45">Notes</span><span class="text-white/70 text-right max-w-[180px]">${a.notes}</span></div>` : ''}
        ${service ? `<div class="flex justify-between text-sm"><span class="text-white/45">Price</span><span class="gold-text font-bold">${formatRp(a.bookedPrice ?? service.price)}</span></div>` : ''}
      </div>`;
    openModal('modal-appt-detail');
    const payBtn = document.getElementById('appt-detail-pay-btn');
    if (payBtn) {
      const canPay = a.status === 'confirmed' || a.status === 'completed';
      payBtn.classList.toggle('hidden', !canPay);
      payBtn.onclick = () => Appointments.processPayment(a.id);
    }
  },

  changeStatus(status) {
    const a = AppData.appointments.find(x => x.id === this.detailId);
    if (!a) return;
    a.status = status;
    AppData.save('appointments');
    closeModal('modal-appt-detail');
    this.renderCalendar();
    this.renderList();
    showToast(`Appointment marked as ${statusLabel(status)}`, 'success');
  },

  editFromDetail() {
    closeModal('modal-appt-detail');
    this.editById(this.detailId);
  },

  deleteFromDetail() {
    showConfirm('Delete Appointment', 'This appointment will be permanently removed.', () => {
      AppData.appointments = AppData.appointments.filter(a => a.id !== this.detailId);
      AppData.save('appointments');
      closeModal('modal-appt-detail');
      this.renderCalendar();
      this.renderList();
      showToast('Appointment deleted', 'warning');
    });
  },

  processPayment(id) {
    const a = AppData.appointments.find(x => x.id === id);
    if (!a) return;
    const svc  = getServiceById(a.serviceId);
    const barb = getBarberById(a.barberId);
    if (!svc) {
      showToast('Service no longer exists — cannot process payment', 'error');
      return;
    }
    const price = a.bookedPrice ?? resolveBookingPrice(svc, barb);
    closeModal('modal-appt-detail');
    POS.prefill({ barberId: a.barberId, serviceId: a.serviceId, price, customer: a.customer });
    navigate('pos');
  }
};
