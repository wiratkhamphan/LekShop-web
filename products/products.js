  // ---------- Utils ----------

  const qs = s => document.querySelector(s);

  function safeText(s){
    return String(s ?? '').replace(/[<>&"]/g, m=>({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[m]));
  }

  function joinURL(base, path){
    if (!path) return "/img/products/box.png";
    if (/^https?:\/\//i.test(path)) return path;        // เป็น URL เต็มอยู่แล้ว
    const b = String(base||'').replace(/\/+$/,'');      // ตัด / ท้าย BASE
    const p = String(path||'').startsWith('/') ? path : '/'+path;
    return b + p;
  }

  function debounce(fn, ms=400){
    let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), ms); };
  }

  // ---- Cart helpers (localStorage ตัวอย่าง) ----
  function updateCartBadge(){
    try{
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const total = cart.reduce((a,c)=> a + (Number(c.quantity||c.qty||0)), 0);
      const icon = document.getElementById("cart-icon");
      if (!icon) return;
      if (total > 0) icon.setAttribute("data-count", String(total));
      else icon.removeAttribute("data-count");
    }catch(e){}
  }
  function addToCart(productId, name="", price=0){
    const key = "cart";
    const cart = JSON.parse(localStorage.getItem(key) || "[]");
    const i = cart.findIndex(x => x.id === productId);
    if (i >= 0) cart[i].quantity = (cart[i].quantity || 1) + 1;
    else cart.push({ id: productId, name, price, quantity: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
    updateCartBadge();
  }

  // ---------- Mobile menu ----------
  (function(){
    const btn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeMenu');
    const menu = document.getElementById('mobileMenu');
    if (btn && menu) btn.addEventListener('click', ()=> menu.style.display = 'block');
    if (closeBtn && menu) closeBtn.addEventListener('click', ()=> menu.style.display = 'none');
  })();

  // ---------- Products Search State ----------
  const state = {
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 0,
    q: "",
    brand: "",
    category: "",
    sort: "new",
    min_price: "",
    max_price: "",
    recommended: false,
    popular: false,
  };

  async function fetchProducts(){
    const params = new URLSearchParams();
    params.set("page", state.page);
    params.set("limit", state.limit);
    if (state.q) params.set("q", state.q);
    if (state.brand) params.set("brand", state.brand);
    if (state.category) params.set("category", state.category);
    if (state.sort) params.set("sort", state.sort);
    if (state.min_price) params.set("min_price", state.min_price);
    if (state.max_price) params.set("max_price", state.max_price);
    if (state.recommended) params.set("recommended", "true");
    if (state.popular) params.set("popular", "true");

    const url = `${API_BASE}/api/products?` + params.toString();
    const res = await fetch(url);
    if (!res.ok){
      const msg = await res.text().catch(()=>res.statusText);
      throw new Error(`${res.status} ${res.statusText} — ${msg}`);
    }
    return res.json();
  }

  function hydrateFilters(items){
    const bSel = qs("#brand");
    const cSel = qs("#category");
    if (!bSel || !cSel) return;

    // ถ้ามีตัวเลือกแล้ว แสดงว่า hydrate ไปแล้ว
    if (bSel.options.length > 1 && cSel.options.length > 1) return;

    const brands = new Set(), cats = new Set();
    for (const p of items){
      if (p.brand) brands.add(p.brand);
      if (p.category) cats.add(p.category);
    }
    for (const b of [...brands].sort()){
      const opt = document.createElement("option");
      opt.value = b; opt.textContent = b;
      bSel.appendChild(opt);
    }
    for (const ct of [...cats].sort()){
      const opt = document.createElement("option");
      opt.value = ct; opt.textContent = ct;
      cSel.appendChild(opt);
    }
  }

  function renderPager(){
    const pager = qs("#pager");
    pager.innerHTML = "";
    if (state.total_pages <= 1) return;

    const mk = (label, page, disabled=false, active=false)=>{
      const a = document.createElement("button");
      a.textContent = label;
      a.disabled = disabled;
      a.style.cssText = `
        padding:8px 12px; border:1px solid var(--c-line,#e5e7eb);
        background:${active ? "#111" : "#fff"};
        color:${active ? "#fff" : "#111"};
        border-radius:10px; min-width:40px;
      `;
      if (!disabled && !active){
        a.addEventListener("click", ()=>{ state.page = page; load(); });
      }
      return a;
    };

    pager.appendChild(mk("«", 1, state.page===1));
    pager.appendChild(mk("‹", Math.max(1, state.page-1), state.page===1));

    const start = Math.max(1, state.page-2);
    const end = Math.min(state.total_pages, state.page+2);
    for (let p=start; p<=end; p++){
      pager.appendChild(mk(String(p), p, false, p===state.page));
    }

    pager.appendChild(mk("›", Math.min(state.total_pages, state.page+1), state.page===state.total_pages));
    pager.appendChild(mk("»", state.total_pages, state.page===state.total_pages));
  }

  function renderProducts(data){
    const box = qs("#results");
    box.innerHTML = "";
    const items = data.items || [];
    state.total = data.total || 0;
    state.total_pages = data.total_pages || 0;

    if (items.length === 0){
      box.innerHTML = `<div style="padding:20px; text-align:center; color:var(--c-muted,#6b7280)">ไม่พบสินค้า</div>`;
      renderPager();
      return;
    }

    hydrateFilters(items);

    for (const p of items){
      const img = joinURL(API_BASE, p.image); // ✅ ให้ joinURL ทำงาน + prefix จาก API_BASE
      const badge = p.recommended ? `<span style="position:absolute; top:10px; left:10px; background:#16a34a; color:#fff; font-size:12px; padding:4px 8px; border-radius:999px;">แนะนำ</span>` : "";
      const popular = p.popular ? `<span style="position:absolute; top:10px; right:10px; background:#0ea5e9; color:#fff; font-size:12px; padding:4px 8px; border-radius:999px;">ยอดนิยม</span>` : "";

      const card = document.createElement("article");
      card.className = "product-card";
      card.style.cssText = "position:relative; background:#fff; border:1px solid var(--c-line,#e5e7eb); border-radius:14px; box-shadow: var(--shadow-1,0 4px 12px rgba(2,6,23,.06)); overflow:hidden;";
      card.innerHTML = `
        <div style="aspect-ratio: 4/3; background:#f8fafc;">
          <img src="${img}" alt="${safeText(p.name||'')}" style="width:100%; height:100%; object-fit:cover;">
        </div>
        ${badge}${popular}
        <div style="padding:12px 12px 14px;">
          <div style="font-weight:600; margin-bottom:4px;">${safeText(p.name||"-")}</div>
          <div style="font-size:12px; color:#64748b; margin-bottom:8px;">${safeText(p.brand||"-")} • ${safeText(p.category||"-")}</div>
          <div style="display:flex; align-items:center; gap:8px;">
            <strong>${THB(p.sell_price)}</strong>
            ${p.original_price ? `<s style="color:#94a3b8">${THB(p.original_price)}</s>` : ""}
          </div>
          <button class="add-to-cart" data-id="${p.product_id}" data-name="${safeText(p.name||'')}" data-price="${Number(p.sell_price||0)}"
            style="margin-top:10px; width:100%; padding:10px 12px; border:1px solid var(--c-line,#e5e7eb); border-radius:10px; background:#111; color:#fff;">
            เพิ่มลงตะกร้า
          </button>
        </div>
      `;
      box.appendChild(card);
    }

    // bind add-to-cart
    box.querySelectorAll(".add-to-cart").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.dataset.id;
        const name = btn.dataset.name || "";
        const price = Number(btn.dataset.price||0);
        addToCart(id, name, price);
      });
    });

    renderPager();
  }

  // ===== Bind UI =====
  const debouncedSearch = debounce(()=>{
    state.page = 1;
    state.q = qs("#q")?.value.trim() || "";
    load();
  }, 450);

  function bindUI(){
    const headerSearch = document.querySelector(".search-box input");
    if (headerSearch){
      headerSearch.addEventListener("input", ()=>{
        const v = headerSearch.value || "";
        const inline = qs("#q");
        if (inline) inline.value = v;
        debouncedSearch();
      });
    }

    qs("#q")?.addEventListener("input", debouncedSearch);
    qs("#brand")?.addEventListener("change", ()=>{ state.page = 1; state.brand = qs("#brand").value; load(); });
    qs("#category")?.addEventListener("change", ()=>{ state.page = 1; state.category = qs("#category").value; load(); });
    qs("#sort")?.addEventListener("change", ()=>{ state.page = 1; state.sort = qs("#sort").value; load(); });

    qs("#apply")?.addEventListener("click", ()=>{
      state.page = 1;
      state.min_price = qs("#min_price")?.value || "";
      state.max_price = qs("#max_price")?.value || "";
      state.recommended = !!qs("#recommended")?.checked;
      state.popular = !!qs("#popular")?.checked;
      load();
    });
    qs("#reset")?.addEventListener("click", ()=>{
      const id = s => document.getElementById(s);
      if (id("q")) id("q").value = "";
      if (id("brand")) id("brand").value = "";
      if (id("category")) id("category").value = "";
      if (id("sort")) id("sort").value = "new";
      if (id("min_price")) id("min_price").value = "";
      if (id("max_price")) id("max_price").value = "";
      if (id("recommended")) id("recommended").checked = false;
      if (id("popular")) id("popular").checked = false;

      state.page = 1;
      state.q = ""; state.brand=""; state.category=""; state.sort="new";
      state.min_price=""; state.max_price="";
      state.recommended=false; state.popular=false;
      load();
    });
  }

  async function load(){
    try{
      const data = await fetchProducts();
      renderProducts(data);
    }catch(err){
      console.error(err);
      const box = qs("#results");
      if (box) box.innerHTML = `<div style="padding:20px; text-align:center; color:#b91c1c">เกิดข้อผิดพลาด: ${safeText(err.message||err)}</div>`;
    }
  }

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', () => {
    bindUI();
    updateCartBadge();
    load();
  });