// Product Grid View Script
// Requires: app.js (apiJSON, ENDPOINTS, THB), products.js (Products)

(function(){
  const qs = (s, el=document)=> el.querySelector(s);
  const qsa = (s, el=document)=> [...el.querySelectorAll(s)];

  const state = {
    view: localStorage.getItem('p_view') || 'grid'
  };

  function getInputs(){
    const get = id => qs('#'+id)?.value?.trim() || '';
    const getNum = id => {
      const v = (qs('#'+id)?.value || '').trim();
      return v!=='' ? Number(v) : '';
    };
    const getBool = id => qs('#'+id)?.checked ? 'true' : '';
    return {
      q: get('p_q'),
      brand: get('p_brand'),
      category: get('p_category'),
      gender: get('p_gender'),
      min: getNum('p_min'),
      max: getNum('p_max'),
      sort: get('p_sort'),
      recommended: getBool('p_recommended'),
      popular: getBool('p_popular'),
      page: Number(qs('#p_page')?.value||1),
      limit: Number(qs('#p_limit')?.value||24) || 24
    };
  }

  function buildQuery(obj){
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([k,v])=>{
      if(v!=='' && v!=null){ params.append(k, v); }
    });
    return params.toString();
  }

  function qtyBadgeClass(n){
    const q = Number(n||0);
    if(q<=0) return 'bg-danger-subtle text-danger';
    if(q<=10) return 'bg-warning-subtle text-warning';
    return 'bg-success-subtle text-success';
  }

  function applyViewButtons(){
    const vt = qs('#p_view_table');
    const vg = qs('#p_view_grid');
    if(vt) vt.classList.toggle('active', state.view==='table');
    if(vg) vg.classList.toggle('active', state.view==='grid');
  }

  function toggleContainers(){
    const cards = qs('#p_cards');
    const table = qs('#p_tbl');
    const tableWrap = table?.closest('.table-responsive');
    if(!cards || !tableWrap) return;
    if(state.view==='grid'){
      cards.style.display = '';
      tableWrap.style.display = 'none';
    }else{
      cards.style.display = 'none';
      tableWrap.style.display = '';
    }
    applyViewButtons();
  }

  function renderCards(items){
    const wrap = qs('#p_cards'); if(!wrap) return;
    wrap.innerHTML = (items||[]).map(p=>{
      const pid = p.product_id || p.id || '';
      const img = p.image_url || p.image || `/img/products/${pid}.jpg`;
      const name = p.name || '-';
      const brand = p.brand || '';
      const category = p.category || '';
      const qty = (p.quantity||0);
      const price = THB(p.sell_price || 0);
      const orig = p.original_price ? THB(p.original_price) : '';
      const badges = `${p.recommended? '<span class="badge bg-primary-subtle text-primary me-1">แนะนำ</span>':''}${p.popular? '<span class="badge bg-info-subtle text-info">นิยม</span>':''}`;
      const qtyCls = qtyBadgeClass(qty);
      return `
        <div class="col">
          <div class="card h-100 shadow-sm">
            <div class="position-relative">
              <img src="${API_BASE}${img}" alt="${name}" class="card-img-top" style="object-fit:cover;height:180px" onerror="this.onerror=null;this.src='/img/products/box.png'" />
              <div class="position-absolute top-0 start-0 p-2">${badges}</div>
            </div>
            <div class="card-body">
              <div class="small text-muted mb-1">${brand || '-' } • ${category || '-'}</div>
              <h6 class="card-title text-truncate" title="${name}">${name}</h6>
              <div class="d-flex justify-content-between align-items-center mt-2">
                <div class="fw-semibold">${price} ${orig? `<span class='text-muted text-decoration-line-through small ms-1'>${orig}</span>`:''}</div>
                <span class="badge ${qtyCls}">คงเหลือ ${p.quantity ?? 0}</span>
              </div>
            </div>
            <div class="card-footer d-flex justify-content-between">
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary" title="แก้ไข" onclick='Products.openEdit(${JSON.stringify(p)})'><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-primary" title="ปรับจำนวน" onclick="Products.openQty('${pid}', ${qty})"><i class="fa-solid fa-cubes-stacked"></i></button>
                <button class="btn btn-sm btn-outline-danger" title="ลบ" onclick="Products.del('${pid}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('') || `<div class="text-center text-muted py-5">ไม่พบข้อมูล</div>`;
  }

  async function load(){
    try{
      const params = getInputs();
      // In grid mode, favor showing more items by default
      if(!params.limit || params.limit < 1) params.limit = 24;
      const qs = buildQuery(params);
      const url = ENDPOINTS.products + (qs? ('?'+qs):'');
      const data = await apiJSON(url, { method:'GET' });
      const items = Array.isArray(data) ? data : (data.items||[]);
      renderCards(items);
      const summary = document.querySelector('#p_summary');
      const pager = document.querySelector('#p_pager');
      if(summary){
        if(Array.isArray(data)) summary.textContent = `ทั้งหมด ${items.length} ชิ้น`;
        else summary.textContent = `หน้า ${data.page||1}/${data.total_pages||1} • ทั้งหมด ${data.total||items.length} ชิ้น`;
      }
      if(pager) pager.innerHTML = '';
    }catch(e){ console.error(e); }
  }

  function setView(v){
    state.view = v === 'table' ? 'table' : 'grid';
    localStorage.setItem('p_view', state.view);
    toggleContainers();
    if(state.view==='grid') load(); else Products.load?.();
  }

  function init(){
    // default to grid for a refreshed look, keep user preference
    if(!localStorage.getItem('p_view')) localStorage.setItem('p_view','grid');
    state.view = localStorage.getItem('p_view') || 'grid';
    toggleContainers();
    // Buttons
    document.getElementById('p_view_grid')?.addEventListener('click', ()=> setView('grid'));
    document.getElementById('p_view_table')?.addEventListener('click', ()=> setView('table'));
    // If user hits refresh while in grid view, load cards instead of table
    document.getElementById('btn-refresh')?.addEventListener('click', (ev)=>{
      const page = (document.querySelector('.nav a.active')?.dataset.page)||'';
      if(page==='products' && state.view==='grid'){
        ev.preventDefault(); ev.stopPropagation(); load();
      }
    }, true);
    // When navigating to products, if grid view is active, ensure grid shown
    qsa('.nav a[data-page="products"]').forEach(a=>{
      a.addEventListener('click', ()=>{
        setTimeout(()=>{ if(state.view==='grid'){ toggleContainers(); load(); } }, 0);
      });
    });
  }

  // Expose for debugging if needed
  window.ProductGrid = { setView, load, init };

  // Initialize after DOM ready (script is defer)
  try{ init(); }catch(_){ /* ignore */ }
})();

