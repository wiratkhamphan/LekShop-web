const track = document.querySelector('.carousel-track');
const items = document.querySelectorAll('.carousel-item');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');
const dotsContainer = document.querySelector('.carousel-dots');

let index = 0;

function getItemsPerView() {
  if (window.innerWidth <= 600) return 1; // มือถือ
  if (window.innerWidth <= 900) return 2; // แท็บเล็ต
  return 3; // จอใหญ่
}

let itemsPerView = getItemsPerView();
let totalPages = Math.ceil(items.length / itemsPerView);

function createDots() {
  dotsContainer.innerHTML = '';
  totalPages = Math.ceil(items.length / itemsPerView);
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);

    dot.addEventListener('click', () => {
      index = i;
      updateCarousel();
    });
  }
}

const dots = () => document.querySelectorAll('.carousel-dots button');

function updateCarousel() {
  track.style.transform = `translateX(-${index * (100 / itemsPerView)}%)`;
  dots().forEach(dot => dot.classList.remove('active'));
  if (dots()[index]) dots()[index].classList.add('active');
}

prevBtn.addEventListener('click', () => {
  index = index > 0 ? index - 1 : totalPages - 1;
  updateCarousel();
});

nextBtn.addEventListener('click', () => {
  index = index < totalPages - 1 ? index + 1 : 0;
  updateCarousel();
});

// Auto Slide every 10 seconds
setInterval(() => {
  index = index < totalPages - 1 ? index + 1 : 0;
  updateCarousel();
}, 10000);

// Update on window resize
window.addEventListener('resize', () => {
  itemsPerView = getItemsPerView();
  totalPages = Math.ceil(items.length / itemsPerView);
  createDots();
  index = 0;
  updateCarousel();
});

// Initial setup
createDots();
updateCarousel();

// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');

hamburger.addEventListener('click', () => {
  nav.classList.toggle('active');
  if (nav.classList.contains('active')) {
    hamburger.innerHTML = '<i class="fas fa-times"></i>';
  } else {
    hamburger.innerHTML = '<i class="fas fa-bars"></i>';
  }
});
