const API_BASE = ENV.api;

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/product`);
        const data = await res.json();
        const container = document.getElementById("product-list");
        container.innerHTML = "";

        const products = data.products || data;
        products.forEach(product => {
            const div = document.createElement("div");
            div.className = "product-card";
            div.innerHTML = `
                <img src="${API_BASE}${product.image}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <p class="price">฿${product.sell_price.toLocaleString()}</p>
                <button>เพิ่มลงตะกร้า</button>
            `;
            div.querySelector("button").addEventListener("click", () =>
                addToCart(product.product_id, product.name, product.sell_price)
            );
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Products API Error:", err);
    }
}

function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');
    if (!hamburger || !nav) return;
    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
        hamburger.innerHTML = nav.classList.contains('active')
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    initHamburgerMenu();
});
