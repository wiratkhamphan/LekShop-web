// โหลด Hero Slider
async function loadHeroSlider() {
    try {
        const res = await fetch(`${API_BASE}/hero-slider`);
        const data = await res.json();
        const container = document.getElementById("hero-slider");
        container.innerHTML = "";

        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "carousel-item";
            div.innerHTML = `<img src="${API_BASE}${item.image}" alt="${item.name}" />`;
            container.appendChild(div);
        });
    } catch (err) {
        console.error("Hero Slider API Error:", err);
    }
}
