// ===== Config =====
const API_BASE = ENV.api; // from /account/env/env.js
const CART_KEY = "cart";
const ORDERS_KEY = "orders";
const PAYMENT_LABELS = { transfer: "โอนเงิน", cod: "เก็บเงินปลายทาง" };

const fmt = (n) => `${CURRENCY}${Number(n || 0).toLocaleString()}`;

// ===== State & DOM =====
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const els = {
  list: document.getElementById("cart-list"),
  empty: document.getElementById("cart-empty"),
  subtotal: document.getElementById("subtotal"),
  shipping: document.getElementById("shipping"),
  grand: document.getElementById("grand"),
  clear: document.getElementById("clear-cart"),
  checkout: document.getElementById("checkout"),
};

// ===== Helpers =====
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function clampQty(q, stock) {
  let qty = Number(q) || 0;
  if (qty < 0) qty = 0;
  if (typeof stock === "number") qty = Math.min(qty, Math.max(stock, 0));
  return qty;
}
function uuid4(){
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0, v = c==='x'? r : (r&0x3|0x8); return v.toString(16);
    });
}
function getPaymentMethod() {
  const r = document.querySelector('input[name="payment"]:checked');
  const v = r ? r.value : 'transfer';
  return v === 'cod' ? 'COD' : v === 'promptpay' ? 'PROMPTPAY' : 'BANK_TRANSFER';
}

// ===== Merge & sanitize =====
// รวมรายการซ้ำด้วย (id, variant) + ข้าม item ที่ไม่มี id
function mergeCartItems(items){
  const map = new Map();
  items.forEach(it => {
    const id = it.id ?? it.product_id;      // ✅ รองรับทั้ง id / product_id
    if (!id) return;                         // ✅ ข้ามของเสีย
    const key = `${id}||${(it.variant||'').trim().toLowerCase()}`;
    if (!map.has(key)) map.set(key, { ...it, id });
    else map.get(key).quantity = clampQty((map.get(key).quantity||0)+(Number(it.quantity)||0), it.stock);
  });
  return [...map.values()];
}

// ===== Render =====
function renderCart(){
  const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  cart = mergeCartItems(raw).filter(it => (it.id ?? it.product_id) && Number(it.quantity) > 0); // ✅ sanitize
  saveCart();

  els.list.innerHTML = '';
  if (cart.length === 0) {
    document.querySelector('.table-wrap').style.display = 'none';
    els.empty.hidden = false;
    updateTotals();
    return;
  }
  document.querySelector('.table-wrap').style.display = '';
  els.empty.hidden = true;

  let subtotal = 0;
  cart.forEach((it, index) => {
    const line = (Number(it.price)||0) * (Number(it.quantity)||0);
    subtotal += line;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="item">
          <img src="${it.image || FALLBACK_IMG}" alt="${it.name || ''}" onerror="this.src='${FALLBACK_IMG}'" />
          <div>
            <div class="name">${it.name || '-'}</div>
            ${it.variant ? `<div class="variant">ตัวเลือก: ${it.variant}</div>` : ''}
            ${typeof it.stock === 'number' ? `<div class="stock">คงเหลือ: ${it.stock}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${THB(it.price || 0)}</td>
      <td>
        <div class="qty">
          <button type="button" data-dec="${index}">−</button>
          <input type="number" min="0" ${typeof it.stock==='number'?`max="${it.stock}"`:''} value="${it.quantity||0}" data-qty="${index}">
          <button type="button" data-inc="${index}">+</button>
        </div>
      </td>
      <td>${THB(line)}</td>
      <td><button type="button" class="remove-btn" data-remove="${index}">ลบ</button></td>
    `;
    els.list.appendChild(tr);
  });
  updateTotals(subtotal);

  // Bind events
  els.list.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click', e=>{
    const i = Number(e.currentTarget.getAttribute('data-inc'));
    setQty(i, (cart[i]?.quantity||0)+1);
  }));
  els.list.querySelectorAll('[data-dec]').forEach(b=>b.addEventListener('click', e=>{
    const i = Number(e.currentTarget.getAttribute('data-dec'));
    setQty(i, (cart[i]?.quantity||0)-1);
  }));
  els.list.querySelectorAll('[data-qty]').forEach(inp=>{
    inp.addEventListener('input', e=>{
      const i = Number(e.currentTarget.getAttribute('data-qty'));
      const max = typeof cart[i].stock === 'number' ? cart[i].stock : Infinity;
      if (Number(e.currentTarget.value) > max) e.currentTarget.value = max;
    });
    inp.addEventListener('change', e=>{
      const i = Number(e.currentTarget.getAttribute('data-qty'));
      setQty(i, Number(e.currentTarget.value));
    });
  });
  els.list.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click', e=>{
    const i = Number(e.currentTarget.getAttribute('data-remove'));
    removeAt(i);
  }));
}

function updateTotals(subtotal=0){
  const shipping = 0; // ปรับตามนโยบาย
  const grand = subtotal + shipping;
  els.subtotal.textContent = THB(subtotal);
  els.shipping.textContent = THB(shipping);
  els.grand.textContent = THB(grand);
}

// ===== Ops =====
function setQty(index, qty){
  const it = cart[index]; if (!it) return;
  it.quantity = clampQty(qty, it.stock);
  if (it.quantity <= 0) cart.splice(index,1);
  saveCart();
  renderCart();
});

checkoutBtn?.addEventListener("click", () => {
  const jwtToken = localStorage.getItem("token");
  if (!jwtToken) {
    window.location.href = "/account/login/";
    return;
  }

  const payload = { items, payment_method: getPaymentMethod() };

  els.checkout.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': uuid4(),
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>({}));

    if (!res.ok) {
      if (res.status === 409 && data.product_id) {
        alert(`สต๊อกไม่พอ (ID: ${data.product_id}) คงเหลือ ${data.stock_left}`);
      } else if (res.status === 401) {
        window.location.href = '/account/login/';
      } else {
        alert(data.error || 'สั่งซื้อไม่สำเร็จ');
      }
      return;
    }

  const payment = document.querySelector('input[name="payment"]:checked')?.value || "transfer";

  const summary = cart.map(i => `${i.name}${i.variant ? ` (${i.variant})` : ""} x ${i.quantity}`).join("\n");
  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  orders.push({ items: cart, payment, createdAt: new Date().toISOString() });
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  alert(`คุณสั่งสินค้า:\n${summary}\nรวมทั้งหมด: ${fmt(total)}\nชำระด้วย: ${PAYMENT_LABELS[payment]}`);
  cart = [];
  localStorage.removeItem(CART_KEY);
  renderCart();
});

// ===== Init =====
renderCart();
