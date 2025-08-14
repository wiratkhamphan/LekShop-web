// =========================
// 🎯 Hero Slider Functions
// =========================
function getItemsPerView() {
  if (window.innerWidth <= 600) return 1; // มือถือ
  if (window.innerWidth <= 900) return 2; // แท็บเล็ต
  return 3; // จอใหญ่
}

function createDots() {
  dotsContainer.innerHTML = '';
  totalPages = Math.ceil(items.length / itemsPerView);

  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement('button');
    if (i === index) dot.classList.add('active');
    dot.addEventListener('click', () => {
      index = i;
      updateCarousel();
    });
    dotsContainer.appendChild(dot);
  }
}

function updateCarousel() {
  const slideWidth = document.querySelector('.carousel-item').clientWidth;
  track.style.transform = `translateX(-${index * slideWidth * itemsPerView}px)`;
  document.querySelectorAll('.carousel-dots button').forEach(dot => dot.classList.remove('active'));
  if (document.querySelectorAll('.carousel-dots button')[index]) {
    document.querySelectorAll('.carousel-dots button')[index].classList.add('active');
  }
}

function prevSlide() {
  index = index > 0 ? index - 1 : totalPages - 1;
  updateCarousel();
}

function nextSlide() {
  index = index < totalPages - 1 ? index + 1 : 0;
  updateCarousel();
}

function autoSlide() {
  setInterval(() => {
    nextSlide();
  }, 10000);
}

function initCarousel() {
  itemsPerView = getItemsPerView();
  totalPages = Math.ceil(items.length / itemsPerView);
  createDots();
  updateCarousel();
}

// =========================
// 🎯 Hamburger Menu Functions
// =========================
function toggleHamburgerMenu() {
  nav.classList.toggle('active');
  hamburger.innerHTML = nav.classList.contains('active')
    ? '<i class="fas fa-times"></i>'
    : '<i class="fas fa-bars"></i>';
}

function initHamburgerMenu() {
  hamburger.addEventListener('click', toggleHamburgerMenu);
}

// =========================
// 🚀 Initialization
// =========================
const track = document.querySelector('.carousel-track');
const items = document.querySelectorAll('.carousel-item');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const dotsContainer = document.querySelector('.carousel-dots');

let index = 0;
let itemsPerView = getItemsPerView();
let totalPages = Math.ceil(items.length / itemsPerView);

const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');

// Event Listeners
prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

window.addEventListener('resize', () => {
  itemsPerView = getItemsPerView();
  totalPages = Math.ceil(items.length / itemsPerView);
  createDots();
  index = 0;
  updateCarousel();
});


// Start everything
initCarousel();
autoSlide();
initHamburgerMenu();
