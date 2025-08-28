// ===== ENV =====
const API = ENV.api;
const THB = n => `฿${Number(n || 0).toLocaleString("th-TH")}`;
const qs = sel => document.querySelector(sel);

// ===== Helpers =====
function joinURL(base, path) {
  if (!path) return '/img/products/box.png';
  if (/^https?:\/\//i.test(path)) return path;
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? path : '/' + path;
  return b + p;
}

async function apiJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    let msg = '';
    try { msg = await res.text(); } catch { msg = res.statusText; }
    throw new Error(`${res.status} ${res.statusText} — ${msg}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : null;
}

async function withLoading(btn, fn) {
  if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
  try { return await fn(); }
  finally { if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); } }
}

function authHeaders(h = {}) {
  const t = localStorage.getItem('token'); // ถ้ามี JWT
  return t ? { ...h, Authorization: `Bearer ${t}` } : h;
}

function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }

// คอนโทรลสถานะ popular (รองรับทั้ง name="popular" และ name="recommended")
function getPopularityControl() {
  return els.form?.elements['popular'] || els.form?.elements['recommended'] || null;
}

// ===== State & Elements =====
let state = {
  page: 1,
  limit: 12,
  q: "",
  category: "",
  brand: "",
  gender: "",
  popular: "", // ใช้ popular เป็นหลัก ("", "true", "false")
  data: [],
};

const els = {
  tbody: qs("#tbody"),
  info: qs("#info"),
  prevBtn: qs("#prevBtn"),
  nextBtn: qs("#nextBtn"),
  q: qs("#q"),
  fCat: qs("#filter-category"),
  fBrand: qs("#filter-brand"),
  fGender: qs("#filter-gender"),
  // หมายเหตุ: ใช้ select id="filter-popular" เป็นตัวกรอง popular
  fRec: qs("#filter-popular"),
  refresh: qs("#refreshBtn"),
  openAdd: qs("#openAdd"),
  modal: qs("#modal"),
  modalTitle: qs("#modalTitle"),
  form: qs("#formProduct"),
  cancelModal: qs("#cancelModal"),
  closeModal: qs("#closeModal"),
  preview: qs("#preview"),
  submitBtn: qs("#submitBtn"),
};

// ===== Modal =====
function openModal(title = "เพิ่มสินค้า", data = null) {
  els.modalTitle.textContent = title;
  els.form?.reset();
  if (els.preview) {
    els.preview.src = "";
    els.preview.style.display = "none";
  }
  if (els.form) {
    els.form.dataset.mode = data ? "edit" : "add";
    els.form.dataset.originalId = data?.product_id || "";
    els.form.dataset.onlyImage = data?.onlyImage ? "true" : "false";
  }

  if (data && els.form) {
    if (els.form.product_id) els.form.product_id.value = data.product_id ?? "";
    if (els.form.name) els.form.name.value = data.name ?? "";
    if (els.form.brand) els.form.brand.value = data.brand ?? "";
    if (els.form.category) els.form.category.value = data.category ?? "";
    if (els.form.gender) els.form.gender.value = data.gender ?? "";
    if (els.form.quantity) els.form.quantity.value = data.quantity ?? 0;
    if (els.form.cost_price) els.form.cost_price.value = data.cost_price ?? 0;
    if (els.form.sell_price) els.form.sell_price.value = data.sell_price ?? 0;
    if (els.form.original_price) els.form.original_price.value = data.original_price ?? "";

    const popCtl = getPopularityControl();
    if (popCtl) popCtl.value = String(!!(data.popular ?? data.recommended));

    if (data.image && els.preview) {
      els.preview.src = joinURL(API, data.image);
      els.preview.style.display = "block";
    }
  }
  els.modal?.classList.add("open");
}
function closeModal() { els.modal?.classList.remove("open"); }

on(els.openAdd, "click", () => openModal("เพิ่มสินค้าใหม่", null));
on(els.cancelModal, "click", closeModal);
on(els.closeModal, "click", closeModal);

on(els.form?.image, "change", e => {
  const f = e.target.files?.[0];
  if (!f || !els.preview) { if (els.preview) els.preview.style.display = "none"; return; }
  els.preview.src = URL.createObjectURL(f);
  els.preview.style.display = "block";
});

// ===== API Calls =====
async function loadProducts() {
  if (els.info) els.info.textContent = "กำลังโหลด…";
  if (els.tbody) els.tbody.innerHTML = "";

  try {
    const res = await apiJSON(`${API}/admin/product`, { headers: authHeaders() });
    let items = Array.isArray(res?.products) ? res.products : [];

    // map ให้รองรับ API เก่าที่ใช้ recommended
    items = items.map(x => ({ ...x, popular: (x.popular ?? x.recommended ?? false) }));

    // filters (client-side)
    const q = (state.q || "").toLowerCase();
    if (q) {
      items = items.filter(x =>
        (x.product_id || "").toLowerCase().includes(q) ||
        (x.name || "").toLowerCase().includes(q) ||
        (x.brand || "").toLowerCase().includes(q) ||
        (x.category || "").toLowerCase().includes(q)
      );
    }
    if (state.category) items = items.filter(x => (x.category || "") === state.category);
    if (state.brand) items = items.filter(x => (x.brand || "") === state.brand);
    if (state.gender) items = items.filter(x => (x.gender || "") === state.gender);
    if (state.popular !== "") {
      const want = state.popular === "true";
      items = items.filter(x => !!x.popular === want);
    }

    // fill filters
    fillFilterDistinct(items);

    // paging
    state.total = items.length;
    const start = (state.page - 1) * state.limit;
    const pageItems = items.slice(start, start + state.limit);

    pageItems.forEach(p => els.tbody?.insertAdjacentHTML("beforeend", rowHTML(p)));
    if (els.info) els.info.textContent = `${Math.min(state.page * state.limit, state.total)} / ${state.total} รายการ`;
    if (els.prevBtn) els.prevBtn.disabled = state.page <= 1;
    if (els.nextBtn) els.nextBtn.disabled = state.page * state.limit >= state.total;

    bindTableEvents();
  } catch (err) {
    console.error(err);
    if (els.info) els.info.textContent = "โหลดไม่สำเร็จ";
    alert("โหลดสินค้าล้มเหลว: " + err.message);
  }
}

async function updateQuantity(product_id, quantity) {
  await apiJSON(`${API}/admin/product/${encodeURIComponent(product_id)}/quantity`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ quantity })
  });
}

// toggle popular (manual) → เส้นทาง /products/:id/popular
async function togglePopular(product_id, popular) {
  await apiJSON(`${API}/admin/products/${encodeURIComponent(product_id)}/popular`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ popular })
  });
}

async function deleteProduct(product_id) {
  await apiJSON(`${API}/admin/product/${encodeURIComponent(product_id)}`, {
    method: "DELETE",
    headers: authHeaders()
  });
}

async function upsertProduct(formData) {
  // ใส่ popular และ recommended ทั้งคู่ เพื่อเข้ากันได้กับ backend ได้ทั้งสองแบบ
  const popCtl = getPopularityControl();
  if (popCtl && !formData.has('popular')) formData.set('popular', popCtl.value);
  if (popCtl && !formData.has('recommended')) formData.set('recommended', popCtl.value);

  await apiJSON(`${API}/admin/product`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });
}

async function updateProductJSON(product_id, payload) {
  // ส่งทั้ง popular และ recommended
  const popCtl = getPopularityControl();
  const popBool = popCtl ? (popCtl.value === "true") : false;
  const body = { ...payload, popular: popBool, recommended: popBool };

  await apiJSON(`${API}/product/${encodeURIComponent(product_id)}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });
}

// ===== Table =====
function rowHTML(p) {
  const inStock = (Number(p.quantity || 0) > 0);
  const price = Number(p.sell_price || 0);
  const original = p.original_price ? Number(p.original_price) : 0;

  return `
  <tr data-id="${p.product_id}">
    <td><img class="img" src="${joinURL(API, p.image)}" onerror="this.src='/img/products/box.png'" alt=""></td>
    <td>
      <div>${p.product_id || ""}</div>
      <div class="mini">${p.brand || "-"} • ${p.category || "-"} ${p.gender ? ("• " + p.gender) : ""}</div>
    </td>
    <td class="left">
      <div>${p.name || "-"}</div>
      <div class="mini">${inStock ? '<span class="badge ok">มีสต็อก</span>' : '<span class="badge no">หมดสต็อก</span>'}</div>
    </td>
    <td>
      <div class="price">${THB(price)}</div>
      ${original > price ? `<div class="strike">${THB(original)}</div>` : ""}
    </td>
    <td>
      <div class="qty-editor">
        <button class="icon-btn dec" title="ลดจำนวน"><i class="fa-solid fa-minus"></i></button>
        <input class="qty" type="number" min="0" value="${p.quantity || 0}">
        <button class="icon-btn inc" title="เพิ่มจำนวน"><i class="fa-solid fa-plus"></i></button>
        <button class="icon-btn save" title="บันทึกจำนวน"><i class="fa-solid fa-floppy-disk"></i></button>
      </div>
    </td>
    <td>
      <button class="icon-btn popular" title="${p.recommended ? 'ยกเลิกแนะนำ' : 'ตั้งแนะนำ'}">
        <i class="fa${p.recommended ? '-solid' : '-regular'} fa-star star"></i>
      </button>
    </td>
    <td>
      <button class="icon-btn popular" title="${p.popular ? 'ยกเลิกแนะนำ' : 'ตั้งแนะนำ'}">
        <i class="fa${p.popular ? '-solid' : '-regular'} fa-star star"></i>
      </button>
    </td>
    <td>
      <div class="actions">
        <button class="btn-outline edit"><i class="fa-regular fa-pen-to-square"></i> แก้ไข</button>
        <button class="btn-outline imgupdate"><i class="fa-regular fa-image"></i> เปลี่ยนรูป</button>
        <button class="btn-danger delete"><i class="fa-regular fa-trash-can"></i> ลบ</button>
      </div>
    </td>
  </tr>`;
}

function bindTableEvents() {
  els.tbody?.querySelectorAll("tr").forEach(tr => {
    const id = tr.dataset.id;
    const qtyInput = tr.querySelector(".qty");

    on(tr.querySelector(".inc"), "click", () => qtyInput.value = Number(qtyInput.value || 0) + 1);
    on(tr.querySelector(".dec"), "click", () => qtyInput.value = Math.max(0, Number(qtyInput.value || 0) - 1));

    on(tr.querySelector(".save"), "click", async (e) => {
      await withLoading(e.currentTarget, async () => {
        await updateQuantity(id, Number(qtyInput.value || 0));
        await loadProducts();
      });
    });

    on(tr.querySelector(".popular"), "click", async (e) => {
      const nowActive = tr.querySelector(".fa-star")?.classList.contains("fa-regular"); // ถ้า regular -> จะตั้งให้เป็น popular
      await withLoading(e.currentTarget, async () => {
        await togglePopular(id, !!nowActive);
        await loadProducts();
      });
    });

    on(tr.querySelector(".edit"), "click", () => {
      const p = readRow(tr);
      openModal("แก้ไขสินค้า", p);
    });

    on(tr.querySelector(".imgupdate"), "click", () => {
      const p = readRow(tr);
      openModal("อัปเดตรูปสินค้า", { ...p, onlyImage: true });
    });

    on(tr.querySelector(".delete"), "click", async (e) => {
      if (!confirm(`ลบสินค้า ${id}?`)) return;
      await withLoading(e.currentTarget, async () => {
        await deleteProduct(id);
        await loadProducts();
      });
    });
  });
}

// อ่านค่าจาก row
function readRow(tr) {
  const sku = tr.dataset.id;
  const name = tr.querySelector("td:nth-child(3) > div")?.textContent.trim() || "";
  const qty = Number(tr.querySelector(".qty")?.value || 0);
  const brandCatTxt = tr.querySelector("td:nth-child(2) .mini")?.textContent || ""; // "Nike • Running • men"
  const [brand, category, genderMaybe] = brandCatTxt.split("•").map(x => x.trim());
  const isPop = tr.querySelector(".fa-star")?.classList.contains("fa-solid") || false;
  const priceTxt = (tr.querySelector(".price")?.textContent || "").replace(/[^\d.]/g, "");
  const price = Number(priceTxt || 0);
  const imgEl = tr.querySelector("img.img");
  return {
    product_id: sku,
    name,
    quantity: qty,
    brand: brand === "-" ? "" : (brand || ""),
    category: category === "-" ? "" : (category || ""),
    gender: (genderMaybe || "").toLowerCase() || "",
    sell_price: price,
    image: imgEl?.getAttribute("src") || "",
    popular: isPop,
    recommended: isPop, 
  };
}

// ===== Filters =====
function fillFilterDistinct(items) {
  const cats = Array.from(new Set(items.map(x => x.category).filter(Boolean))).sort();
  const brands = Array.from(new Set(items.map(x => x.brand).filter(Boolean))).sort();
  fillSelect(els.fCat, cats, "หมวดหมู่ทั้งหมด");
  fillSelect(els.fBrand, brands, "แบรนด์ทั้งหมด");
}
function fillSelect(sel, arr, first) {
  if (!sel) return;
  const v = sel.value;
  sel.innerHTML = `<option value="">${first}</option>` + arr.map(x => `<option>${x}</option>`).join("");
  sel.value = v;
}

// ===== Paging & events =====
on(els.prevBtn, "click", () => { if (state.page > 1) { state.page--; loadProducts(); } });
on(els.nextBtn, "click", () => { if (state.page * state.limit < state.total) { state.page++; loadProducts(); } });
on(els.refresh, "click", () => loadProducts());

let typing;
on(els.q, "input", e => {
  clearTimeout(typing);
  typing = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; loadProducts(); }, 300);
});

// ผูก change เฉพาะตัวที่มีจริง
[els.fCat, els.fBrand, els.fGender, els.fRec]
  .filter(Boolean)
  .forEach(sel => {
    sel.addEventListener("change", () => {
      state.category = els.fCat?.value || "";
      state.brand = els.fBrand?.value || "";
      state.gender = els.fGender?.value || "";
      state.popular = els.fRec?.value || ""; // "", "true", "false"
      state.page = 1; loadProducts();
    });
  });

// ===== Submit add/edit =====
on(els.form, "submit", async (e) => {
  e.preventDefault();
  const mode = els.form?.dataset.mode; // add | edit
  const onlyImage = els.form?.dataset.onlyImage === "true";
  const btn = els.submitBtn;

  await withLoading(btn, async () => {
    if (mode === "add") {
      const fd = new FormData(els.form);
      await upsertProduct(fd);
      closeModal();
      await loadProducts();
      return;
    }

    // edit
    const pid = els.form?.dataset.originalId;
    const imgFile = els.form?.image?.files?.[0];

    // 1) ถ้ามีรูป -> ใช้ POST /product (UPSERT)
    if (imgFile) {
      const fd = new FormData();
      ["product_id", "name", "brand", "category", "gender", "quantity", "cost_price", "sell_price", "original_price"]
        .forEach(k => {
          const v = els.form[k]?.value ?? "";
          if (v !== "") fd.append(k, v);
        });
      const popCtl = getPopularityControl();
      if (popCtl) {
        fd.set("popular", popCtl.value);
        fd.set("recommended", popCtl.value);
      }
      fd.set("product_id", pid);
      fd.append("image", imgFile);
      await upsertProduct(fd);
      if (onlyImage) { closeModal(); await loadProducts(); return; }
    }

    // 2) PUT JSON
    const popCtl = getPopularityControl();
    const popBool = popCtl ? (popCtl.value === "true") : false;
    const payload = {
      name: els.form.name.value,
      quantity: Number(els.form.quantity.value || 0),
      cost_price: Number(els.form.cost_price.value || 0),
      sell_price: Number(els.form.sell_price.value || 0),
      popular: popBool,
      recommended: popBool,
    };
    await updateProductJSON(pid, payload);
    closeModal(); await loadProducts();
  });
});

// ===== Init =====
loadProducts();
