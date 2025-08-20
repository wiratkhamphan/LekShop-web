// ===== Utilities =====
const CURRENCY = "฿";
const IMG_FALLBACK = "/img/products/box.png";
const CART_KEY = "cart";

const fmt = (n) => `${CURRENCY}${Number(n || 0).toLocaleString()}`;

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = loadCart();

const cartList = document.getElementById("cart-list");
const totalEl = document.getElementById("total");
const clearBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout");

// ===== Core: เพิ่ม/ลบ/อัปเดต =====
function addToCart(item) {
  // item = {id, name, price, quantity, image, variant, stock}
  const idx = cart.findIndex((p) => p.id === item.id && p.variant === item.variant);
  if (idx > -1) {
    // รวมจำนวน
    const newQty = cart[idx].quantity + (item.quantity || 1);
    cart[idx].quantity = clampQty(newQty, cart[idx].stock);
  } else {
    item.quantity = clampQty(item.quantity || 1, item.stock);
    cart.push(item);
  }
  saveCart(cart);
  renderCart();
}

function removeAt(index) {
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function setQty(index, qty) {
  const item = cart[index];
  if (!item) return;
  item.quantity = clampQty(qty, item.stock);
  if (item.quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart(cart);
  renderCart();
}

function clampQty(qty, stock) {
  let q = Number(qty) || 0;
  if (q < 0) q = 0;
  if (typeof stock === "number") {
    q = Math.min(q, Math.max(stock, 0));
  }
  return q;
}

// ===== Render =====
function renderCart() {
  cart = loadCart(); // เผื่อมีหน้าอื่นแก้ cart ไว้
  cartList.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartList.innerHTML = `<tr><td colspan="6">ตะกร้าว่าง</td></tr>`;
    totalEl.textContent = `รวมทั้งหมด: ${fmt(0)}`;
    return;
  }

  cart.forEach((item, index) => {
    const line = item.price * item.quantity;
    total += line;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${item.image || IMG_FALLBACK}" alt="${item.name}" onerror="this.src='${IMG_FALLBACK}'" style="width:60px;border-radius:5px"></td>
      <td>
        <div style="font-weight:600">${item.name}</div>
        ${item.variant ? `<div style="font-size:12px;color:#888">ตัวเลือก: ${item.variant}</div>` : ""}
        ${typeof item.stock === "number" ? `<div style="font-size:12px;color:#888">คงเหลือ: ${item.stock}</div>` : ""}
      </td>
      <td>${fmt(item.price)}</td>
      <td>
        <div style="display:flex; align-items:center; justify-content:center; gap:6px;">
          <button aria-label="decrease" style="padding:4px 8px;" data-dec="${index}">-</button>
          <input type="number" min="0" ${typeof item.stock === "number" ? `max="${item.stock}"` : ""} value="${item.quantity}" data-qty="${index}"
            style="width:60px; text-align:center; padding:6px 4px; border:1px solid #ddd; border-radius:6px;" />
          <button aria-label="increase" style="padding:4px 8px;" data-inc="${index}">+</button>
        </div>
      </td>
      <td>${fmt(line)}</td>
      <td>
        <button class="remove-btn" data-remove="${index}">ลบ</button>
      </td>
    `;
    cartList.appendChild(tr);
  });

  totalEl.textContent = `รวมทั้งหมด: ${fmt(total)}`;

  // ผูกเหตุการณ์ให้ปุ่ม/อินพุตที่เพิ่งสร้าง
  cartList.querySelectorAll("[data-inc]").forEach(btn =>
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-inc"));
      setQty(i, cart[i].quantity + 1);
    })
  );
  cartList.querySelectorAll("[data-dec]").forEach(btn =>
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-dec"));
      setQty(i, cart[i].quantity - 1);
    })
  );
  cartList.querySelectorAll("[data-qty]").forEach(input =>
    input.addEventListener("change", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-qty"));
      setQty(i, Number(e.currentTarget.value));
    })
  );
  cartList.querySelectorAll("[data-remove]").forEach(btn =>
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.getAttribute("data-remove"));
      removeAt(i);
    })
  );
}

// ===== Actions =====
clearBtn?.addEventListener("click", () => {
  cart = [];
  localStorage.removeItem(CART_KEY);
  renderCart();
});

checkoutBtn?.addEventListener("click", () => {
  const jwtToken = localStorage.getItem("token");
  if (!jwtToken) {
    window.location.href = "/account/login/";
    return;
  }

  if (cart.length === 0) {
    alert("ตะกร้าว่าง ไม่มีสินค้าชำระเงิน");
    return;
  }

  // ตัวอย่าง summary + พร้อมส่งไป backend ได้
  const summary = cart.map(i => `${i.name}${i.variant ? ` (${i.variant})` : ""} x ${i.quantity}`).join("\n");
  const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  alert(`คุณสั่งสินค้า:\n${summary}\nรวมทั้งหมด: ${fmt(total)}`);

  // TODO: เรียก API สร้างออเดอร์ -> ส่ง cart ไป backend
  // fetch(`${API_BASE}/orders`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${jwtToken}`}, body: JSON.stringify({items: cart}) })

  cart = [];
  localStorage.removeItem(CART_KEY);
  renderCart();
});

// เริ่มต้น
renderCart();

// ===== Export addToCart ให้หน้าอื่นเรียกได้ (เช่น product list) =====
window.addToCart = addToCart;
