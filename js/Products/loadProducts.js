const API_BASE = ENV.api ;
const FALLBACK_IMG = "/img/products/box.png";
const THB = n => `฿${Number(n || 0).toLocaleString("th-TH")}`;

const els = {
  list: document.getElementById("product-list"),
  count: document.getElementById("result-count"),
  sort: document.getElementById("sort"),
  search: document.getElementById("search"),
  filters: document.getElementById("filters"),
  toggleFilters: document.getElementById("filter-toggle"),
  categoryChips: document.getElementById("category-chips"),
  priceMin: document.getElementById("price-min"),
  priceMax: document.getElementById("price-max"),
  applyPrice: document.getElementById("apply-price"),
  clearFilters: document.getElementById("clear-filters"),
  loadMore: document.getElementById("load-more"),
  cartIcon: document.getElementById("cart-icon"),
};

// ค่าหน้า/ตัวกรองปัจจุบัน
const state = {
  page: 1,
  limit: 16,
  hasMore: true,
  q: "",
  sort: "popularity",
  categories: [],
  genders: [],
  priceMin: "",
  priceMax: "",
};

// หมวดหมู่ตัวอย่าง (หากอยากดึงจาก API ก็ได้)
const CATEGORIES = ["Running","Lifestyle","Basketball","Training","Outdoor","Kids"];

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  renderCategoryChips();
  bindEvents();
  renderSkeletons(12);
  fetchAndRender(true);
  updateCartBadge();
});

// ===== Events =====
function bindEvents(){
  els.toggleFilters?.addEventListener("click", () => {
    els.filters?.classList.toggle("open");
  });

  els.search?.addEventListener("input", debounce(() => {
    state.q = (els.search.value || "").trim();
    refresh();
  }, 350));

  els.sort?.addEventListener("change", () => {
    state.sort = els.sort.value;
    refresh();
  });

  els.applyPrice?.addEventListener("click", () => {
    state.priceMin = els.priceMin.value;
    state.priceMax = els.priceMax.value;
    refresh();
  });

  els.clearFilters?.addEventListener("click", () => {
    state.categories = [];
    state.genders = [];
    state.priceMin = state.priceMax = "";
    els.priceMin.value = els.priceMax.value = "";
    document.querySelectorAll('input[name="gender"]').forEach(i => (i.checked = false));
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    refresh();
  });

  document.querySelectorAll('input[name="gender"]').forEach(i => {
    i.addEventListener("change", () => {
      const checked = Array.from(document.querySelectorAll('input[name="gender"]:checked')).map(x => x.value);
      state.genders = checked;
      refresh();
    });
  });

  els.loadMore?.addEventListener("click", () => {
    if (state.hasMore) {
      state.page += 1;
      fetchAndRender(false);
    }
  });
}

// ===== Render helpers =====
function renderCategoryChips(){
  if(!els.categoryChips) return;
  els.categoryChips.innerHTML = CATEGORIES.map(c => `
    <button class="chip" data-val="${c}">${c}</button>
  `).join("");
  els.categoryChips.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const v = chip.dataset.val;
      chip.classList.toggle("active");
      if (chip.classList.contains("active")) {
        state.categories.push(v);
      } else {
        state.categories = state.categories.filter(x => x !== v);
      }
      refresh();
    });
  });
}

function renderSkeletons(n=8){
  els.list.innerHTML = Array.from({length:n}).map(() => `
    <article class="card">
      <div class="thumb skeleton"></div>
      <div class="body">
        <div class="skeleton" style="height:18px;width:80%"></div>
        <div class="skeleton" style="height:14px;width:50%;margin-top:6px"></div>
        <div class="skeleton" style="height:18px;width:40%;margin-top:auto"></div>
        <div class="skeleton" style="height:36px;width:100%;border-radius:10px;margin-top:10px"></div>
      </div>
    </article>
  `).join("");
}

function productCard(p){
  const {
    id, name, brand, category, gender,
    price, original_price, discount_percent,
    image
  } = p;

  const badge = discount_percent ? `<span class="badge">-${discount_percent}%</span>` : "";
  const priceRow = original_price && original_price>price
    ? `<div class="price-row"><span class="price">${THB(price)}</span><span class="strike">${THB(original_price)}</span></div>`
    : `<div class="price-row"><span class="price">${THB(price)}</span></div>`;

  const meta = [brand, category, gender].filter(Boolean).join(" • ");

  return `
  <article class="product-card ">
    <a class="thumb" href="/products/${id || ""}" aria-label="${name}">
      ${badge}
      <img src="${API_BASE}${image || FALLBACK_IMG}" alt="${name}" onerror="this.src='${FALLBACK_IMG}'" />
    </a>
    <div class="body">
      <div class="name">${name || "Product"}</div>
      <div class="meta">${meta || "&nbsp;"}</div>
      ${priceRow}
      <div class="actions">
        <button class="btn" data-add="${encodeURIComponent(JSON.stringify(p))}">
          เพิ่มลงตะกร้า
        </button>
        <a class="btn-outline" href="/products/${id || ""}" title="ดูรายละเอียด">
          <i class="fa-regular fa-eye"></i>
        </a>
      </div>
    </div>
  </article>`;
}

// ===== Data fetch & render =====
async function fetchAndRender(reset){
  try{
    if (reset){
      state.page = 1;
      state.hasMore = true;
      renderSkeletons(12);
    }

    const params = new URLSearchParams();
    params.set("page", state.page);
    params.set("limit", state.limit);
    if (state.q) params.set("q", state.q);
    if (state.sort) params.set("sort", state.sort);
    if (state.categories.length) params.set("categories", state.categories.join(","));
    if (state.genders.length) params.set("genders", state.genders.join(","));
    if (state.priceMin) params.set("price_min", state.priceMin);
    if (state.priceMax) params.set("price_max", state.priceMax);

    const url = `${API_BASE}/products?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();

    // คาดรูปแบบ { items:[], total:123 }
    const items = data.items || data.data || [];
    const total = Number(data.total ?? items.length);

    if (reset) els.list.innerHTML = "";
    els.list.insertAdjacentHTML("beforeend", items.map(productCard).join(""));

    // bind add-to-cart
    els.list.querySelectorAll("[data-add]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const p = JSON.parse(decodeURIComponent(btn.dataset.add));
        addToCartSafe(p);
      });
    });

    // count + hasMore
    const shown = els.list.querySelectorAll(".card").length;
    els.count.textContent = `${shown.toLocaleString()} / ${Number(total).toLocaleString()} รายการ`;
    state.hasMore = shown < total;
    els.loadMore.style.display = state.hasMore ? "inline-flex" : "none";
  }catch(err){
    console.error(err);
    els.list.innerHTML = `
      <div class="muted" style="grid-column:1/-1;text-align:center;padding:24px">
        เกิดข้อผิดพลาดในการโหลดสินค้า กรุณาลองใหม่อีกครั้ง
      </div>`;
    els.loadMore.style.display = "none";
    els.count.textContent = "โหลดไม่สำเร็จ";
  }
}

function refresh(){ fetchAndRender(true); }

// ===== Cart integration (ใช้ของคุณถ้ามี, มี fallback ถ้าไม่มี) =====
function addToCartSafe(p){
  if (typeof window.addToCart === "function"){
    window.addToCart(p);
  } else {
    // fallback: เก็บ localStorage แบบง่าย ๆ
    const CART_KEY = "cart";
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    // โครงสร้างขั้นต่ำ
    const item = {
      id: p.id, name: p.name, price: p.price, qty: 1,
      image: p.image || FALLBACK_IMG
    };
    // ถ้ามีอยู่แล้ว +1
    const idx = cart.findIndex(x => x.id === item.id);
    if (idx >= 0) cart[idx].qty += 1; else cart.push(item);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  updateCartBadge();
  // แจ้งเตือนเล็ก ๆ
  toast(`เพิ่ม “${p.name}” ลงตะกร้าแล้ว`);
}

function updateCartBadge(){
  if (!els.cartIcon) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const count = cart.reduce((a,c)=>a + Number(c.qty||1), 0);
  els.cartIcon.setAttribute("data-count", count);
}

// ===== Tiny toast =====
let toastTimer;
function toast(msg){
  let t = document.getElementById("toast");
  if (!t){
    t = document.createElement("div");
    t.id = "toast";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "20px";
    t.style.transform = "translateX(-50%)";
    t.style.background = "rgba(17,17,17,.92)";
    t.style.color = "#fff";
    t.style.padding = "10px 14px";
    t.style.borderRadius = "10px";
    t.style.zIndex = "9999";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ t.style.opacity = "0"; }, 1600);
}

// ===== Utils =====
function debounce(fn, delay=300){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(()=>fn.apply(null,args), delay);
  };
}
