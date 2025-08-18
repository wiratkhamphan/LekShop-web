async function loadRecommendedProducts() {
    try {
        const res = await fetch(`${API_BASE}/products/recommended`);
        const data = await res.json();
        const container = document.querySelector(".product-list");
        container.innerHTML = "";

    data.recommended_products.forEach(product => {
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
        <img src="${API_BASE}${product.image}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p class="price">฿${product.sell_price.toLocaleString()}</p>
        <button>เพิ่มลงตะกร้า</button>
    `;
    const btn = div.querySelector("button");
    btn.addEventListener("click", () => addToCart(product.product_id, product.name, product.sell_price));
    container.appendChild(div);
});

        // ผูก event ให้ปุ่มใหม่
        document.querySelectorAll(".add-to-cart").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const product = e.target.closest(".product-card");
                addToCart(product);
            });
        });

    } catch (err) {
        console.error("Recommended Products API Error:", err);
    }
}
