// cart.js
window.addToCart = function(product_id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(item => item.product_id === product_id);
    if (existing) existing.quantity += 1;
    else cart.push({ product_id, name, price, quantity: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));

    // อัปเดตตัวเลขตะกร้า
    updateCartIcon();
};

// ฟังก์ชันอัปเดตไอคอน
window.updateCartIcon = function() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const icon = document.getElementById("cart-icon");
    if(icon) icon.setAttribute("data-count", totalQty);
}

// โหลดจำนวนตะกร้าตอนหน้าโหลด
document.addEventListener("DOMContentLoaded", updateCartIcon);
