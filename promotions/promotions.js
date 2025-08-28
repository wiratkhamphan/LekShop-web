// ===== Config & Utils =====
const CART_KEY = "cart";
const FALLBACK_IMG = "/img/products/box.png";
const PAGE_SIZE = 8;

const fmtDate = (d) => new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });

let state = {
  all: [],
  filtered: [],
  page: 1,
  countdownTimers: {},
};

// ===== Data Source =====
async function fetchPromotions() {
  // รองรับ 3 แหล่ง: API → ไฟล์โลคอล → fallback array
  try {
    if (API_BASE) {
      const r = await fetch(`${API_BASE}/promotions`);
      if (r.ok) return await r.json();
    }
  } catch {}
  try {
    const r2 = await fetch("promotions.json");
    if (r2.ok) return await r2.json();
  } catch {}
  // fallback demo
  return [
    {
      id: "PRM-001",
      title: "Nike Air Max Pulse",
      brand: "Nike",
      category: "Lifestyle",
      image: "/img/sample/airmax.jpg",
      price: 5900, discountPercent: 25,
      startDate: "2025-08-15T00:00:00+07:00",
      endDate: "2025-09-05T23:59:59+07:00",
      couponCode: "NIKE25",
      stock: 57,
      tags: ["new","best"]
    },
    {
      id: "PRM-002",
      title: "Adidas Ultraboost Light",
      brand: "Adidas",
      category: "Running",
      image: "/img/sample/ub.jpg",
      price: 7200, discountPercent: 30,
      startDate: "2025-08-10T00:00:00+07:00",
      endDate: "2025-08-31T23:59:59+07:00",
      couponCode: "ABOOST30",
      stock: 18,
      tags: ["best"]
    },
    {
      id: "PRM-003",
      title: "Converse Chuck 70",
      brand: "Converse",
      category: "Lifestyle",
      image: "/img/sample/chuck70.jpg",
      price: 3200, discountPercent: 15,
      startDate: "2025-08-01T00:00:00+07:00",
      endDate: "2025-09-20T23:59:59+07:00",
      couponCode: "CHK15",
      stock: 120,
      tags: ["clearance"]
    }
  ];
}

// ===== Render =====
function discountPrice(p, disc) {
  return Math.max(0, Math.round(p * (100 - disc) / 100));
}

function cardTemplate(item) {
  const now = Date.now();
  const end = new Date(item.endDate).getTime();
  const expired = end < now;
  const priceNow = discountPrice(item.price, item.discountPercent);

  const tags = (item.tags || []).map(t => {
    const cls = t === "member" ? "badge-member" : "badge-tag";
    return `<span class="badge ${cls}">#${t}</span>`;
  }).join("");

  return `
  <article class="promo-card ${expired ? "card-disabled" : ""}" data-id="${item.id}">
    <img class="promo-img" src="${item.image || FALLBACK_IMG}" alt="${item.title}" onerror="this.src='${FALLBACK_IMG}'" />

    <div class="promo-badges">
      <span class="badge badge-discount">-${item.discountPercent}%</span>
      ${tags}
    </div>

    <div class="promo-body">
      <h3 class="promo-title">${item.title}</h3>
      <div class="promo-brand">${item.brand}</div>
      <div class="promo-category">${item.category}</div>

      <div class="promo-price">
        <span class="price-now">${THB(priceNow)}</span>
        <span class="price-old">${THB(item.price)}</span>
      </div>
    </div>

    <div class="promo-coupon">
      <div>
        <div>คูปอง: <code>${item.couponCode || "-"}</code></div>
        <small>ใช้ได้ถึง ${fmtDate(item.endDate)}</small>
      </div>
      <button class="btn-copy" data-coupon="${item.couponCode || ""}" ${expired ? "disabled" : ""}>คัดลอก</button>
    </div>

    <div class="promo-meta">
      <div class="countdown" id="cd-${item.id}">--:--:--</div>
      <div>คงเหลือ ${item.stock ?? "-"} ชิ้น</div>
    </div>

    <div class="promo-actions">
      <button class="btn add-to-cart" ${expired ? "disabled" : ""} data-id="${item.id}"><i class="fa-solid fa-cart-plus"></i> เพิ่มลงตะกร้า</button>
      <a class="btn btn-outline" href="/products/?q=${encodeURIComponent(item.title)}">ดูสินค้า</a>
    </div>
  </article>`;
}

function skeleton(n=8) {
  const sk = [];
  for (let i=0;i<n;i++){
    sk.push(`
      <article class="promo-card skeleton">
        <div class="promo-img skel"></div>
        <div class="promo-body">
          <div class="skel skel-line"></div>
          <div class="skel skel-line" style="width:70%"></div>
          <div class="skel skel-line" style="width:40%"></div>
        </div>
      </article>
    `);
  }
  return sk.join("");
}

// ===== Filters / Sort =====
function applyFilters() {
  const brand = document.getElementById("filter-brand").value;
  const category = document.getElementById("filter-category").value;
  const search = document.getElementById("search").value.trim().toLowerCase();
  const tagsSelect = /** @type {HTMLSelectElement} */(document.getElementById("filter-tags"));
  const tagVals = Array.from(tagsSelect.selectedOptions).map(o => o.value);
  const min = Number(document.getElementById("price-min").value);
  const max = Number(document.getElementById("price-max").value);

  let arr = [...state.all];

  if (brand) arr = arr.filter(x => x.brand === brand);
  if (category) arr = arr.filter(x => x.category === category);
  if (tagVals.length) arr = arr.filter(x => (x.tags || []).some(t => tagVals.includes(t)));
  if (search) {
    arr = arr.filter(x => `${x.title} ${x.couponCode || ""}`.toLowerCase().includes(search));
  }
  arr = arr.filter(x => {
    const pNow = discountPrice(x.price, x.discountPercent);
    return pNow >= min && pNow <= max;
  });

  // sort
  const sort = document.getElementById("sort").value;
  const now = Date.now();
  arr.sort((a,b) => {
    const aNow = discountPrice(a.price, a.discountPercent);
    const bNow = discountPrice(b.price, b.discountPercent);
    if (sort === "discount") return b.discountPercent - a.discountPercent;
    if (sort === "ending") return new Date(a.endDate) - new Date(b.endDate);
    if (sort === "price-asc") return aNow - bNow;
    if (sort === "price-desc") return bNow - aNow;
    if (sort === "newest") return new Date(b.startDate) - new Date(a.startDate);
    // trending (approx) = ใกล้หมดเขต + ส่วนลดสูง + ยังไม่หมดอายุ
    const score = (x) => {
      const timeLeft = Math.max(0, new Date(x.endDate).getTime() - now);
      const soon = 1 / Math.max(1, timeLeft);
      return soon * 1.2 + x.discountPercent * 1.0 + (x.tags?.includes("best") ? 10 : 0);
    };
    return score(b) - score(a);
  });

  state.filtered = arr;
  state.page = 1;
  renderPage();
}

function renderPage() {
  const grid = document.getElementById("promo-grid");
  const empty = document.getElementById("promo-empty");
  const btnMore = document.getElementById("load-more");

  const start = 0;
  const end = state.page * PAGE_SIZE;
  const slice = state.filtered.slice(start, end);

  grid.innerHTML = slice.map(cardTemplate).join("");

  // toggle empty
  empty.hidden = slice.length > 0;

  // load more
  btnMore.style.display = state.filtered.length > end ? "inline-grid" : "none";

  // bind events for current page
  bindCardEvents(slice);
  startCountdowns(slice);
}

function bindCardEvents(items) {
  // copy coupon
  document.querySelectorAll(".btn-copy").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const code = e.currentTarget.dataset.coupon || "";
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        e.currentTarget.textContent = "คัดลอกแล้ว";
        setTimeout(()=> e.currentTarget.textContent = "คัดลอก", 1200);
      } catch {
        alert(`คูปอง: ${code}`);
      }
    });
  });

  // add to cart
  document.querySelectorAll(".add-to-cart").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const item = items.find(x => x.id === id) || state.all.find(x => x.id === id);
      if (!item) return;

      const product = {
        id: item.id,
        name: item.title,
        price: discountPrice(item.price, item.discountPercent),
        qty: 1,
        image: item.image || FALLBACK_IMG,
      };

      // ถ้ามี cart.js ที่ฟัง event
      window.dispatchEvent(new CustomEvent("cart:add", { detail: product }));

      // fallback เขียนลง localStorage
      try {
        let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        const idx = cart.findIndex(p => p.id === product.id);
        if (idx >= 0) cart[idx].qty += 1; else cart.push(product);
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch {}

      // อัปเดต badge ไอคอนตะกร้า ถ้ามี
      const icon = document.getElementById("cart-icon");
      if (icon) {
        const c = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        icon.setAttribute("data-count", String(c.reduce((s, x) => s + (x.qty || 0), 0)));
      }
    });
  });
}

// ===== Countdown =====
function startCountdowns(items) {
  // clear timers
  for (const id in state.countdownTimers) {
    clearInterval(state.countdownTimers[id]);
    delete state.countdownTimers[id];
  }

  items.forEach(it => {
    const cid = `cd-${it.id}`;
    const el = document.getElementById(cid);
    if (!el) return;
    const end = new Date(it.endDate).getTime();

    const tick = () => {
      const now = Date.now();
      let diff = end - now;
      if (diff <= 0) {
        el.textContent = "หมดเวลาแล้ว";
        const card = el.closest(".promo-card");
        if (card && !card.classList.contains("card-disabled")) {
          card.classList.add("card-disabled");
          card.querySelectorAll("button").forEach(b => b.disabled = true);
        }
        clearInterval(state.countdownTimers[it.id]);
        delete state.countdownTimers[it.id];
        return;
      }
      const d = Math.floor(diff / (1000*60*60*24)); diff %= 1000*60*60*24;
      const h = Math.floor(diff / (1000*60*60));    diff %= 1000*60*60;
      const m = Math.floor(diff / (1000*60));       diff %= 1000*60;
      const s = Math.floor(diff / 1000);
      el.textContent = `${d}วัน ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    };
    tick();
    state.countdownTimers[it.id] = setInterval(tick, 1000);
  });
}

// ===== Init =====
function fillBrandOptions(data) {
  const brands = [...new Set(data.map(x => x.brand))].sort();
  const sel = document.getElementById("filter-brand");
  brands.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b; opt.textContent = b;
    sel.appendChild(opt);
  });
}

function bindControls() {
  document.getElementById("filter-brand").addEventListener("change", applyFilters);
  document.getElementById("filter-category").addEventListener("change", applyFilters);
  document.getElementById("filter-tags").addEventListener("change", applyFilters);
  document.getElementById("search").addEventListener("input", debounce(applyFilters, 200));
  document.getElementById("sort").addEventListener("change", applyFilters);

  const min = document.getElementById("price-min");
  const max = document.getElementById("price-max");
  const minLbl = document.getElementById("price-min-label");
  const maxLbl = document.getElementById("price-max-label");
  const updateRange = () => {
    let a = Number(min.value), b = Number(max.value);
    if (a > b) [a,b] = [b,a];
    min.value = a; max.value = b;
    minLbl.textContent = a.toLocaleString("th-TH");
    maxLbl.textContent = b.toLocaleString("th-TH");
    applyFilters();
  };
  min.addEventListener("input", updateRange);
  max.addEventListener("input", updateRange);

  document.getElementById("load-more").addEventListener("click", () => {
    state.page += 1;
    renderPage();
  });
}

function debounce(fn, ms=250) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms); };
}

async function initPromotions() {
  const grid = document.getElementById("promo-grid");
  grid.innerHTML = skeleton(PAGE_SIZE);

  const data = await fetchPromotions();
  state.all = Array.isArray(data) ? data : [];
  fillBrandOptions(state.all);
  bindControls();
  applyFilters();

  // อัปเดต badge ตะกร้า
  const icon = document.getElementById("cart-icon");
  if (icon) {
    const c = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    icon.setAttribute("data-count", String(c.reduce((s, x) => s + (x.qty || 0), 0)));
  }
}

document.addEventListener("DOMContentLoaded", initPromotions);
