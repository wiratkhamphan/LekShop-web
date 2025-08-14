// ฟังก์ชันโหลด Hero Slider

function loadHeroSlider() {
  fetch(`${API_BASE}/hero-slider`)
    .then(res => res.json())
    .then(data => {
      const slider = document.getElementById("hero-slider");
      slider.innerHTML = data.map(item => `
        <div class="carousel-item">
          <img src="${API_BASE}${item.image}" alt="${item.alt}" />
        </div>
      `).join("");
      initCarousel(); 
    })
    .catch(err => console.error("Hero Slider API Error:", err));
}
