// ===================== Config & Helpers =====================
const API_BASE = ENV.api;
const API = API_BASE;
const ENDPOINTS = {
  login: '/api/auth/login',
  me: '/api/auth/me',
  products: '/admin/products',
  promos: '/api/admin/promotions',
  promoItems: (id) => `/api/admin/promotions/${id}/items`,
};

const $ = (s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const THB = n=>`฿${Number(n||0).toLocaleString('th-TH',{maximumFractionDigits:2})}`;
function showToast(msg){ $('#toast-text').textContent = msg||'บันทึกสำเร็จ'; $('#toast').classList.add('show'); setTimeout(()=>$('#toast').classList.remove('show'),1600); }
function swalToast(icon, title){ Swal.fire({toast:true,position:'top-end',showConfirmButton:false,timer:1500,icon,title}); }
function errBox(e){ console.error(e); Swal.fire({icon:'error',title:'เกิดข้อผิดพลาด',text: String(e?.message||e)}); }

function authHeader(){ const t = localStorage.getItem('token'); return t? { 'Authorization': 'Bearer '+t }: {}; }
async function apiJSON(path, opts={}){
  const url = API + path;
  const headers = Object.assign({'Content-Type':'application/json'}, authHeader(), opts.headers||{});
  const res = await fetch(url, {...opts, headers, credentials:'include'});
  if(!res.ok){ throw new Error((await res.text())||res.statusText); }
  const ct = res.headers.get('content-type')||''; return ct.includes('application/json')? res.json(): null;
}

// Page switcher
function setPage(id){
  $$('.nav a').forEach(a=>a.classList.toggle('active', a.dataset.page===id));
  $('#page-title').textContent = { 'dashboard':'แดชบอร์ด','products':'สินค้า','promotions':'โปรโมชัน','promo-items':'สินค้าในโปรฯ'}[id]||id;
  $$('#page-dashboard, #page-products, #page-promotions, #page-promo-items').forEach(s=> s.style.display='none');
  $('#page-'+id).style.display='block';
}
$$('.nav a[data-page]').forEach(a=>a.addEventListener('click', e=>{
  e.preventDefault();
  const id=a.dataset.page;
  setPage(id);
  if(id==='products') Products.load();
  if(id==='promotions') loadPromos();
  if(id==='promo-items') initPromoItemsPage();
}));

$('#btn-theme').addEventListener('click',()=>{ document.body.classList.toggle('light'); })
$('#btn-refresh').addEventListener('click',()=>{
  const id = $$('.nav a.active')[0].dataset.page;
  if(id==='products') Products.load();
  if(id==='promotions') loadPromos();
  if(id==='dashboard') refreshMetrics();
});
$('#btn-logout').addEventListener('click', e=>{ e.preventDefault(); localStorage.removeItem('token'); location.reload(); })

// ===================== Auth (Demo) =====================
async function ensureLogin(){
  try{
    const me = await apiJSON(ENDPOINTS.me, { method:'GET' });
    $('#u-name').textContent = me?.name||'Admin'; $('#u-role').textContent = me?.role||'Admin';
  }catch(e){
    const email = prompt('อีเมล (demo):','admin@example.com'); if(email===null) return;
    const password = prompt('รหัสผ่าน (demo):','1234'); if(password===null) return;
    try{
      const r = await apiJSON(ENDPOINTS.login,{ method:'POST', body: JSON.stringify({ email, password }) });
      if(r?.token){ localStorage.setItem('token', r.token); showToast('เข้าสู่ระบบแล้ว'); ensureLogin(); }
    }catch(err){ alert('เข้าสู่ระบบไม่สำเร็จ'); }
  }
}

// ===================== Dashboard =====================
async function refreshMetrics(){
  try{
    const [prods, promos] = await Promise.all([
      apiJSON(ENDPOINTS.products+'?limit=1&count=1'),
      apiJSON(ENDPOINTS.promos+'?limit=1&count=1'),
    ]);
    $('#m-products').textContent = prods?.total ?? '—';
    $('#m-promos').textContent = promos?.total ?? '—';
    $('#m-promo-items').textContent = promos?.promo_items ?? '—';
    $('#m-last').textContent = new Date().toLocaleString('th-TH');
  }catch(e){ /* silently */ }
}

// Quick Actions buttons
$('#qa-add-product')?.addEventListener('click', ()=>{ setPage('products'); Products.openNew(); });
$('#qa-add-promo')?.addEventListener('click', ()=>{ setPage('promotions'); openPromoForm(); });

// ===================== Products Module =====================
const Products = (function(){
  const EP = {
    list: ENDPOINTS.products,
    create: ENDPOINTS.products,
    update: (id) => ENDPOINTS.products + '/' + id,
    remove: (id) => ENDPOINTS.products + '/' + id,
    qty: (id) => ENDPOINTS.products + '/' + id + '/quantity',
    recommended: (id) => ENDPOINTS.products + '/' + id + '/recommended',
    popular: (id) => ENDPOINTS.products + '/' + id + '/popular'
  };

  const el = (s)=>document.querySelector(s);
  const els = {
    tbody: el('#p_tbody'), pager: el('#p_pager'), summary: el('#p_summary'),
    q: el('#p_q'), brand: el('#p_brand'), category: el('#p_category'), gender: el('#p_gender'),
    min: el('#p_min'), max: el('#p_max'), sort: el('#p_sort'),
    recommended: el('#p_recommended'), popular: el('#p_popular'), limit: el('#p_limit'),
    btnSearch: el('#p_btn_search'), btnClear: el('#p_btn_clear'), btnAdd: el('#p_btn_add'),
    imgPreview: el('#p_imgPreview'), image: el('#p_image'),
    product_id: el('#p_product_id'), name: el('#p_name'),
    brand_i: el('#p_brand_i'), category_i: el('#p_category_i'), gender_i: el('#p_gender_i'),
    quantity: el('#p_quantity'), cost_price: el('#p_cost_price'), sell_price: el('#p_sell_price'),
    original_price: el('#p_original_price'), recommended_i: el('#p_recommended_i'),
    modalTitle: el('#p_modalTitle')
  };

  let state = { page:1, limit: parseInt(els.limit?.value||'12',10), total_pages:1, total:0 };
  const editModal = ()=> new bootstrap.Modal(document.getElementById('p_editModal'));
  const qtyModal  = ()=> new bootstrap.Modal(document.getElementById('p_qtyModal'));

  function buildQuery(){
    const kv = [];
    const add=(k,v)=>{ if(v!=='' && v!=null) kv.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`); };
    add('page', state.page); add('limit', state.limit);
    add('q', els.q.value?.trim()); add('brand', els.brand.value?.trim()); add('category', els.category.value?.trim());
    add('gender', els.gender.value); add('min_price', els.min.value); add('max_price', els.max.value);
    add('recommended', els.recommended.value); add('popular', els.popular.value); add('sort', els.sort.value);
    return kv.join('&');
  }
  function genderLabel(g){
    if(g==='unisex') return 'ทุกเพศ'; if(g==='men') return 'ผู้ชาย'; if(g==='women') return 'ผู้หญิง'; return '-';
  }
  function renderRows(items){
    els.tbody.innerHTML = (items||[]).map(p=>{
      const img = p.image || '/img/products/box.png';
      const updated = p.updated_at ? new Date(p.updated_at).toLocaleString('th-TH',{hour12:false}) : '-';
      const pid = p.product_id || p.id || '';
      const imgSrc = img?.startsWith('http') ? img : (API + img);
      const orig = p.original_price ? THB(p.original_price) : '';
      const qty = Number(p.quantity ?? 0);
      const qtyCls = qty<=0 ? 'bg-danger-subtle text-danger' : (qty<=10 ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success');
      return `<tr>
        <td><img class="p-thumb" src="${imgSrc}" alt=""></td>
        <td><span class="badge bg-dark">${pid}</span></td>
        <td><div class="name-clip fw-semibold" title="${p.name||'-'}">${p.name||'-'}</div></td>
        <td>${p.brand||'-'}</td>
        <td>${p.category||'-'}</td>
        <td class="text-center"><span class="badge bg-secondary-subtle text-secondary">${genderLabel(p.gender)}</span></td>
        <td class="text-end">${THB(p.sell_price||0)} ${orig? `<span class="text-muted text-decoration-line-through small ms-1">${orig}</span>`:''}</td>
        <td class="text-end"><span class="badge ${qtyCls}">${qty}</span></td>
        <td class="text-center">
          <div class="form-check form-switch d-inline-block m-0 p-0">
            <input class="form-check-input" type="checkbox" ${p.recommended? 'checked':''}
              onchange="Products.toggleRecommended('${pid}', this.checked)">
          </div>
        </td>
        <td class="text-center">
          <div class="form-check form-switch d-inline-block m-0 p-0">
            <input class="form-check-input" type="checkbox" ${p.popular? 'checked':''}
              onchange="Products.togglePopular('${pid}', this.checked)">
          </div>
        </td>
        <td class="text-end small text-muted">${updated}</td>
        <td class="text-end">
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary btn-icon" title="แก้ไข"
              onclick='Products.openEdit(${JSON.stringify(p)})'><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-outline-primary btn-icon" title="ปรับจำนวน"
              onclick="Products.openQty('${pid}', ${qty})"><i class="fa-solid fa-cubes-stacked"></i></button>
            <button class="btn btn-sm btn-outline-danger btn-icon" title="ลบ"
              onclick="Products.del('${pid}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="12" class="text-center text-muted">ไม่พบข้อมูล</td></tr>`;
  }
  function renderPager(page,total_pages,total,limit){
    els.summary.textContent = `หน้า ${page}/${total_pages} • ทั้งหมด ${total} ชิ้น`;
    const ul = els.pager; ul.innerHTML='';
    const li=(dis,act,label,on)=>{
      const li=document.createElement('li'); li.className=`page-item ${dis?'disabled':''} ${act?'active':''}`;
      const a=document.createElement('a'); a.href='#'; a.className='page-link'; a.textContent=label;
      a.onclick=(e)=>{e.preventDefault(); on&&on();}; li.appendChild(a); ul.appendChild(li);
    };
    li(page<=1,false,'«',()=>{state.page=1; load();});
    li(page<=1,false,'‹',()=>{state.page=Math.max(1,page-1); load();});
    const start=Math.max(1,page-2), end=Math.min(total_pages,page+2);
    for(let i=start;i<=end;i++){ li(false,i===page,String(i),()=>{state.page=i; load();}); }
    li(page>=total_pages,false,'›',()=>{state.page=Math.min(total_pages,page+1); load();});
    li(page>=total_pages,false,'»',()=>{state.page=total_pages; load();});
  }

  async function load(){
    try{
      const qs = buildQuery();
      const url = EP.list + (qs? ('?'+qs):'');
      const data = await apiJSON(url, { method:'GET' });
      if(Array.isArray(data)){
        renderRows(data); els.summary.textContent = `ทั้งหมด ${data.length} ชิ้น`; els.pager.innerHTML='';
      }else{
        renderRows(data.items||[]);
        state.page = data.page ?? state.page;
        state.limit = data.limit ?? state.limit;
        state.total_pages = data.total_pages ?? 1;
        state.total = data.total ?? (data.items?.length||0);
        renderPager(state.page, state.total_pages, state.total, state.limit);
      }
      if(typeof data?.total!=='undefined'){ const m = $('#m-products'); if(m) m.textContent = data.total; }
    }catch(e){ errBox(e); }
  }

  function resetUpsert(){
    els.modalTitle.textContent = 'เพิ่มสินค้า';
    $('#p_formUpsert').reset();
    els.imgPreview.src = '/img/products/box.png';
    els.product_id.readOnly = false;
  }

  // public API
  async function save(e){
    e.preventDefault();
    try{
      const isEdit = els.product_id.readOnly;
      if(isEdit){
        const payload = {
          product_id: els.product_id.value.trim(),
          name: els.name.value.trim(),
          brand: els.brand_i.value.trim(),
          category: els.category_i.value.trim(),
          gender: els.gender_i.value || '',
          quantity: Number(els.quantity.value||0),
          cost_price: Number(els.cost_price.value||0),
          sell_price: Number(els.sell_price.value||0),
          original_price: els.original_price.value? Number(els.original_price.value): null,
          recommended: !!els.recommended_i.checked
        };
        await apiJSON(EP.update(payload.product_id), {
          method:'PUT',
          headers:{'Content-Type':'application/json', ...authHeader()},
          body: JSON.stringify(payload)
        });
      }else{
        // multipart (image upload support)
        const fd = new FormData($('#p_formUpsert'));
        fd.set('recommended', els.recommended_i.checked ? 'true' : 'false');
        await fetch(API + EP.create, { method:'POST', headers:{...authHeader()}, body: fd })
          .then(async r=>{ if(!r.ok) throw new Error(await r.text()); });
      }
      swalToast('success','บันทึกสำเร็จ');
      editModal().hide();
      load(); refreshMetrics?.();
    }catch(ex){ errBox(ex); }
  }

  // bindings
  $('#p_formUpsert').addEventListener('submit', save);
  $('#p_image').addEventListener('change',(ev)=>{
    const f=ev.target.files?.[0]; if(f) els.imgPreview.src = URL.createObjectURL(f);
  });
  $('#p_btn_add').addEventListener('click', ()=>{ resetUpsert(); editModal().show(); });
  $('#p_btn_search').addEventListener('click', ()=>{ state.page=1; load(); });
  $('#p_btn_clear').addEventListener('click', ()=>{
    ['p_q','p_brand','p_category','p_min','p_max'].forEach(id=>{ const x=document.getElementById(id); if(x) x.value=''; });
    els.gender.value=''; els.recommended.value=''; els.popular.value=''; els.sort.value='new';
    state.page=1; load();
  });
  $('#p_limit').addEventListener('change', ()=>{ state.page=1; state.limit=parseInt(els.limit.value||'12',10); load(); });
  ;['p_q','p_brand','p_category','p_min','p_max'].forEach(id=>{
    const x=document.getElementById(id); x&&x.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); state.page=1; load(); } });
  });

  // expose
  return {
    load,
    openNew(){ resetUpsert(); editModal().show(); },
    openEdit(p){
      resetUpsert();
      els.modalTitle.textContent = 'แก้ไขสินค้า';
      els.product_id.value = p.product_id || p.id || '';
      els.product_id.readOnly = true;
      els.name.value = p.name||'';
      els.brand_i.value = p.brand||'';
      els.category_i.value = p.category||'';
      els.gender_i.value = p.gender||'';
      els.quantity.value = p.quantity ?? 0;
      els.cost_price.value = p.cost_price ?? 0;
      els.sell_price.value = p.sell_price ?? 0;
      els.original_price.value = p.original_price ?? '';
      els.recommended_i.checked = !!p.recommended;
      els.imgPreview.src = (p.image && (p.image.startsWith('http')? p.image : (API+p.image))) || '/img/products/box.png';
      editModal().show();
    },
    openQty(product_id, qty){
      $('#p_qty_product_id').value = product_id;
      $('#p_qty_value').value = qty ?? 0;
      qtyModal().show();
    },
    async del(id){
      const res = await Swal.fire({icon:'warning', title:'ลบสินค้า?', text:id, showCancelButton:true, confirmButtonText:'ลบเลย', confirmButtonColor:'#d33'});
      if(!res.isConfirmed) return;
      try{
        await apiJSON(EP.remove(id), { method:'DELETE', headers:{...authHeader()} });
        swalToast('success','ลบสำเร็จ'); load(); refreshMetrics?.();
      }catch(ex){ errBox(ex); }
    },
    async toggleRecommended(id, val){
      try{
        await apiJSON(EP.recommended(id), { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeader()}, body: JSON.stringify({ recommended: !!val }) });
        swalToast('success','อัปเดตแนะนำแล้ว');
      }catch(ex){ errBox(ex); load(); }
    },
    async togglePopular(id, val){
      try{
        await apiJSON(EP.popular(id), { method:'PATCH', headers:{'Content-Type':'application/json', ...authHeader()}, body: JSON.stringify({ popular: !!val }) });
        swalToast('success','อัปเดตยอดนิยมแล้ว');
      }catch(ex){ errBox(ex); load(); }
    }
  };
})();

// Qty form submit
document.getElementById('p_formQty').addEventListener('submit', async (e)=>{
  e.preventDefault();
  try{
    const id = document.getElementById('p_qty_product_id').value;
    const q  = parseInt(document.getElementById('p_qty_value').value,10)||0;
    await apiJSON(ENDPOINTS.products + '/' + id + '/quantity', {
      method:'PATCH', headers:{'Content-Type':'application/json', ...authHeader()}, body: JSON.stringify({ quantity: q })
    });
    swalToast('success','อัปเดตจำนวนแล้ว');
    bootstrap.Modal.getInstance(document.getElementById('p_qtyModal')).hide();
    Products.load(); refreshMetrics?.();
  }catch(ex){ errBox(ex); }
});

// ===================== Promotions =====================
function rowPromo(x){
  const s = x.start_at? new Date(x.start_at).toLocaleDateString('th-TH'):'';
  const e = x.end_at? new Date(x.end_at).toLocaleDateString('th-TH'):'';
  return `<tr>
    <td>${x.id}</td>
    <td>${x.title||'-'}</td>
    <td class="muted">${s} – ${e}</td>
    <td>${x.is_active? '<span style="color:var(--c-green)">ใช้งาน</span>' : '<span class="muted">ปิด</span>'}</td>
    <td>
      <button class="btn" onclick='openPromoForm(${JSON.stringify(x)})'><i class="fa-regular fa-pen-to-square"></i></button>
      <button class="btn" onclick='gotoPromoItems(${x.id})'><i class="fa-solid fa-badge-percent"></i></button>
      <button class="btn danger" onclick='deletePromo(${x.id})'><i class="fa-regular fa-trash-can"></i></button>
    </td>
  </tr>`;
}
async function loadPromos(){
  try{
    const data = await apiJSON(ENDPOINTS.promos, { method:'GET' });
    const rows = (data?.items||data||[]).map(rowPromo).join('');
    $('#tbl-promos tbody').innerHTML = rows || `<tr><td colspan="5" class="muted">ไม่พบโปรโมชัน</td></tr>`;
    if(typeof data?.total!=='undefined') $('#m-promos').textContent = data.total;
  }catch(e){ alert('โหลดโปรโมชันไม่สำเร็จ'); }
}
function openPromoForm(p={}){
  const title = prompt('ชื่อโปรโมชัน:', p.title||''); if(title===null) return;
  const desc = prompt('คำอธิบายโปรโมชัน:', p.description||''); if(desc===null) return;
  const start = prompt('วันเริ่ม (YYYY-MM-DD):', p.start_at?.slice?.(0,10) || ''); if(start===null) return;
  const end = prompt('วันสิ้นสุด (YYYY-MM-DD):', p.end_at?.slice?.(0,10) || ''); if(end===null) return;
  const isActive = confirm('เปิดใช้งานโปรนี้เลยหรือไม่?');
  const payload = { title, description:desc, start_at:start, end_at:end, is_active:isActive };
  if(p && p.id){
    apiJSON(ENDPOINTS.promos + '/' + p.id, { method:'PUT', body: JSON.stringify(payload) })
      .then(()=>{ showToast('อัปเดตโปรโมชันแล้ว'); loadPromos(); refreshMetrics(); })
      .catch(()=> alert('อัปเดตไม่สำเร็จ'))
  }else{
    apiJSON(ENDPOINTS.promos, { method:'POST', body: JSON.stringify(payload) })
      .then(()=>{ showToast('สร้างโปรโมชันแล้ว'); loadPromos(); refreshMetrics(); })
      .catch(()=> alert('สร้างไม่สำเร็จ'))
  }
}
function deletePromo(id){
  if(!confirm('ลบโปรโมชัน #' + id + ' ?')) return;
  apiJSON(ENDPOINTS.promos + '/' + id, { method:'DELETE' })
    .then(()=>{ showToast('ลบแล้ว'); loadPromos(); refreshMetrics(); })
    .catch(()=> alert('ลบไม่สำเร็จ'))
}
function gotoPromoItems(id){ setPage('promo-items'); $('#sel-promo').value = String(id); }

// ===================== Promo Items =====================
async function initPromoItemsPage(){
  try{
    const data = await apiJSON(ENDPOINTS.promos, { method:'GET' });
    $('#sel-promo').innerHTML = (data?.items||data||[]).map(x=>`<option value="${x.id}">#${x.id} — ${x.title}</option>`).join('');
  }catch(e){ $('#sel-promo').innerHTML = '<option>โหลดไม่สำเร็จ</option>'; }
}
document.getElementById('btn-fill-sample')?.addEventListener('click', ()=>{
  $('#ti-json').value = `[
  {"product_id":"SKU001","discount_percent":15},
  {"product_id":"SKU002","discount_amount":200},
  {"product_id":"SKU003","special_price":1890}
]`;
});
document.getElementById('btn-send-promo-items')?.addEventListener('click', async ()=>{
  const id = $('#sel-promo').value; if(!id){ alert('กรุณาเลือกโปรโมชัน'); return; }
  let payload;
  try{ payload = JSON.parse($('#ti-json').value || '[]'); }
  catch{ alert('JSON ไม่ถูกต้อง'); return; }
  if(!Array.isArray(payload) || payload.length===0){ alert('ไม่มีรายการใน JSON'); return; }

  try{
    await apiJSON(ENDPOINTS.promoItems(id), { method:'POST', body: JSON.stringify(payload) });
    showToast('เพิ่มสินค้าเข้าโปรโมชันแล้ว');
  }catch(e){ alert('เพิ่มไม่สำเร็จ: '+e.message); }
});

// ===================== Boot =====================
(async function(){
  await ensureLogin();
  setPage('dashboard');
  refreshMetrics();
})();
