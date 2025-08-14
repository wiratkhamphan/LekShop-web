// ฟังก์ชันโหลดสินค้าแนะนำ
function loadFeaturedProducts() {
  fetch(`${API_BASE}/featured-products`)
    .then(res => res.json())
    .then(data => {
      const products = document.getElementById("featured-products");
      products.innerHTML = data.map(product => `
        <div class="product-card">
          <img src="${product.image}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p class="price">฿${product.price.toLocaleString()}</p>
          <button>เพิ่มลงตะกร้า</button>
        </div>
      `).join("");
    })
    .catch(err => console.error("Products API Error:", err));
}
