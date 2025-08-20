// โหลด cart จาก localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartList = document.getElementById("cart-list");
const totalEl = document.getElementById("total");
const clearBtn = document.getElementById("clear-cart");
const checkoutBtn = document.getElementById("checkout");

// แสดงสินค้าในตะกร้า
function renderCart() {
    cartList.innerHTML = "";
    let total = 0;

    if(cart.length === 0){
        cartList.innerHTML = `<tr><td colspan="6">ตะกร้าว่าง</td></tr>`;
        totalEl.innerText = "รวมทั้งหมด: 0฿";
        return;
    }

    cart.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><img src="${item.image || '/img/products/box.png'}" alt="${item.name}"></td>
            <td>${item.name}</td>
            <td>฿${item.price.toLocaleString()}</td>
            <td>${item.quantity}</td>
            <td>฿${(item.price * item.quantity).toLocaleString()}</td>
            <td><button class="remove-btn" onclick="removeFromCart(${index})">ลบ</button></td>
        `;
        cartList.appendChild(tr);
        total += item.price * item.quantity;
    });

    totalEl.innerText = `รวมทั้งหมด: ${total.toLocaleString()}฿`;
}

// ลบสินค้า
function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

// ล้างตะกร้า
clearBtn.addEventListener("click", () => {
    cart = [];
    localStorage.removeItem("cart");
    renderCart();
});

// ชำระเงิน
checkoutBtn.addEventListener("click", () => {   

    const jwtToken = localStorage.getItem("token")
    if (!jwtToken){
        window.location.href = "/account/login/"
        return;
    }

    if(cart.length === 0){
        alert("ตะกร้าว่าง ไม่มีสินค้าชำระเงิน");
        return;
    }

    let summary = cart.map(i => `${i.name} x ${i.quantity}`).join("\n");
    let total = cart.reduce((sum, i) => sum + i.price*i.quantity, 0);
    alert(`คุณสั่งสินค้า:\n${summary}\nรวมทั้งหมด: ${total.toLocaleString()}฿`);

    cart = [];
    localStorage.removeItem("cart");
    renderCart();
});

// โหลดตะกร้าเมื่อหน้าเปิด
renderCart();