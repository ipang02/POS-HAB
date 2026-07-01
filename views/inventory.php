<!-- ══ VIEW: INVENTORY ══════════════════════════════════════ -->
<section id="view-inventory" class="view">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 class="text-lg font-bold text-white">Inventory</h2>
      <p class="text-xs text-white/35 mt-0.5" id="inv-summary">Loading…</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input type="text" id="inv-search" placeholder="Search products…"
          oninput="Inventory.filter()" class="inp pl-9 py-2.5 text-sm" style="width:200px">
      </div>
      <button onclick="Inventory.openAddModal()" class="btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fa-solid fa-plus text-[11px]"></i> Add Product
      </button>
    </div>
  </div>

  <!-- Category Tabs -->
  <div class="flex gap-2 mb-5 flex-wrap">
    <button class="tab-btn active" data-inv-cat="all" onclick="Inventory.filterCat(this)">All Products</button>
    <button class="tab-btn" data-inv-cat="styling" onclick="Inventory.filterCat(this)">Styling</button>
    <button class="tab-btn" data-inv-cat="haircare" onclick="Inventory.filterCat(this)">Hair Care</button>
    <button class="tab-btn" data-inv-cat="shaving" onclick="Inventory.filterCat(this)">Shaving</button>
    <button class="tab-btn" data-inv-cat="tools" onclick="Inventory.filterCat(this)">Tools</button>
    <button class="tab-btn" data-inv-cat="beard" onclick="Inventory.filterCat(this)">Beard Care</button>
  </div>

  <!-- Low Stock Alert Banner -->
  <div id="low-stock-banner" class="hidden mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/22 rounded-2xl px-5 py-3">
    <i class="fa-solid fa-triangle-exclamation text-red-400 text-lg flex-shrink-0"></i>
    <div>
      <p class="text-sm font-semibold text-red-400">Low Stock Alert</p>
      <p class="text-xs text-red-400/70" id="low-stock-msg">Some products are running low.</p>
    </div>
  </div>

  <!-- Products Grid -->
  <div id="inv-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5"></div>

  <!-- Empty State -->
  <div id="inv-empty" class="hidden text-center py-16">
    <i class="fa-solid fa-box-open text-4xl text-white/14 mb-3 block"></i>
    <p class="text-sm text-white/30">No products found</p>
  </div>

</section>

<!-- Inventory Add/Edit Modal -->
<div id="modal-inv" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-md">
    <div class="p-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-white" id="inv-modal-title">Add Product</h3>
        <button onclick="closeModal('modal-inv')" class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>
      <div class="space-y-4">
        <input type="hidden" id="inv-edit-id">
        <div>
          <label class="text-xs text-white/50 mb-1.5 block font-medium">Product Name</label>
          <input type="text" id="inv-name" placeholder="e.g. Pomade Strong Hold" class="inp">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/50 mb-1.5 block font-medium">Category</label>
            <select id="inv-cat" class="sel">
              <option value="styling">Styling</option>
              <option value="haircare">Hair Care</option>
              <option value="shaving">Shaving</option>
              <option value="tools">Tools</option>
              <option value="beard">Beard Care</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-white/50 mb-1.5 block font-medium">Unit</label>
            <select id="inv-unit" class="sel">
              <option value="pcs">pcs</option>
              <option value="btl">bottle</option>
              <option value="box">box</option>
              <option value="roll">roll</option>
              <option value="unit">unit</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-white/50 mb-1.5 block font-medium">Stock Qty</label>
            <input type="number" id="inv-stock" min="0" value="0" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/50 mb-1.5 block font-medium">Min Stock (Alert)</label>
            <input type="number" id="inv-min-stock" min="1" value="5" class="inp">
          </div>
        </div>
        <div>
          <label class="text-xs text-white/50 mb-1.5 block font-medium">Price (RM)</label>
          <input type="number" id="inv-price" min="0" value="0" placeholder="50000" class="inp">
        </div>
        <div>
          <label class="text-xs text-white/50 mb-1.5 block font-medium">Commission per unit (RM) <span class="text-white/25">(optional)</span></label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-semibold">RM</span>
            <input type="number" id="inv-commission" min="0" step="0.50" placeholder="0 = no commission" class="inp pl-10">
          </div>
          <p class="text-[10px] text-white/30 mt-1">Selling barber earns this fixed amount for each unit sold</p>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal('modal-inv')" class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="Inventory.save()" class="btn-gold flex-1 py-2.5 rounded-xl text-sm font-bold">Save Product</button>
      </div>
    </div>
  </div>
</div>
