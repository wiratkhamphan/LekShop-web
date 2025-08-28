
  // ---------- 1) Popular 
  async function fetchPopular({ url = `${API_BASE}/popular`, limit = 12 } = {}) {
    const track = document.querySelector('.carousel2-track');
    const dots  = document.querySelector('.carousel2-dots');
    if (!track) return;

    // skeleton
    track.innerHTML = Array.from({length:6}).map(()=>`
      <article class="carousel2-item" aria-hidden="true">
        <div style="width:100%;height:180px;background:#0f131b;"></div>
        <div class="item-body">
          <div style="height:18px;width:60%;background:#121827;border-radius:6px;"></div>
          <div style="height:14px;width:40%;background:#121827;border-radius:6px;margin-top:6px;"></div>
        </div>
      </article>`).join('');
    if (dots) dots.innerHTML = '';

    try {
      const res = await fetch(`${url}?limit=${encodeURIComponent(limit)}`); 
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || data.data || []);

      track.innerHTML = (items||[]).map((p,i)=>`
        <article class="carousel2-item" role="option" aria-label="${i+1} จาก ${items.length}">
          <img src="${API_BASE}${safeText(p.image || '/img/products/box.png')}" alt="${safeText(p.title || p.name || 'รุ่นยอดนิยม')}">
          <div class="item-body">
            <h3>${safeText(p.title || p.name || 'รุ่นยอดนิยม')}</h3>
            <p class="price">${THB(p.price || p.sell_price || 0)}</p>
            <button class="btn add" 
              data-id="${safeText(p.id || p.product_id || `SKU${i+1}`)}" 
              data-name="${safeText(p.title || p.name || 'รุ่นยอดนิยม')}" 
              data-price="${safeText(p.price || p.sell_price || 0)}">
              <i class="fa-solid fa-cart-plus"></i> เพิ่มลงตะกร้า
            </button>
          </div>
        </article>
      `).join('');

      attachAddToCart(track);
      // รีเฟรชสไลด์ (ถ้ามีสคริปต์คุมสไลด์เพิ่มเติม)
      window.dispatchEvent(new Event('resize'));
    } catch (err) {
      track.innerHTML = `
        <div style="padding:16px;color:#fca5a5">
          โหลดสินค้ายอดนิยมไม่สำเร็จ: ${safeText(err.message)}
        </div>`;
    }
  }

  // ---------- 2) Featured Products ----------
  async function fetchFeatured({ url = `${API_BASE}/products/recommended`, limit = 6 } = {}) {
    const grid = document.getElementById('featured-products');
    if (!grid) return;

    // skeleton
    grid.innerHTML = Array.from({length:3}).map(()=>`
      <article class="product-card" aria-hidden="true">
        <div class="product-media" style="background:#0f131b"></div>
        <div class="product-body">
          <div style="height:18px;width:70%;background:#121827;border-radius:6px;"></div>
          <div style="height:14px;width:40%;background:#121827;border-radius:6px;margin-top:8px;"></div>
          <div style="height:36px;width:120px;background:#121827;border-radius:12px;margin-top:10px;"></div>
        </div>
      </article>
    `).join('');

    try {
      const res = await fetch(`${url}?limit=${encodeURIComponent(limit)}`); 
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // ✅ backend ตอบ { recommended_products: [...] }
      const items = data.recommended_products || data.items || data.data || [];

      grid.innerHTML = (items||[]).map(p=>`
        <article class="product-card">
          <div class="product-media">
            <img src="${API_BASE}${safeText(p.image || '/img/products/box.png')}" alt="${safeText(p.name)}" />
          </div>
          <div class="product-body">
            <h3>${safeText(p.name)}</h3>
            <p class="price">${THB(p.sell_price ?? p.price ?? 0)}</p>
            <button class="btn add" 
              data-id="${safeText(p.product_id || p.id)}" 
              data-name="${safeText(p.name)}" 
              data-price="${safeText(p.sell_price ?? p.price ?? 0)}">
              <i class="fa-solid fa-cart-plus"></i> เพิ่มลงตะกร้า
            </button>
          </div>
        </article>
      `).join('');

      attachAddToCart(grid);
    } catch (err) {
      grid.innerHTML = `
        <div style="padding:16px;color:#fca5a5">
          โหลดสินค้าแนะนำไม่สำเร็จ: ${safeText(err.message)}
        </div>`;
    }
  }

  

  // ---------- init ----------
  document.addEventListener('DOMContentLoaded', () => {
    fetchPopular();     // ดึงสไลด์ Popular จาก /popular
    fetchFeatured();    // ดึงสินค้าแนะนำจาก /products/recommended
  });


