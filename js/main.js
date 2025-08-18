const API_BASE = ENV.api; 

// เรียกโหลดทั้งสองฟังก์ชันเมื่อ DOM พร้อม
document.addEventListener("DOMContentLoaded", () => {
    loadHeroSlider();
    loadRecommendedProducts();
});