document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector(".header");

  function checkScroll() {
    if (window.scrollY > 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  checkScroll();

  window.addEventListener("scroll", checkScroll);

  const mobileToggle = document.querySelector(".mobile-toggle");

  mobileToggle.addEventListener("click", function () {
    this.classList.toggle("active");
  });

  const menuTabs = document.querySelectorAll(".menu-tab");

  menuTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      menuTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      if (this.getAttribute("href") === "#") return;

      const targetElement = document.querySelector(this.getAttribute("href"));

      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });

  const addButtons = document.querySelectorAll(".menu-item-btn");
  const cartCount = document.querySelector(".cart-count");
  let count = 3;

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      count++;
      cartCount.textContent = count;

      button.style.transform = "scale(1.2)";
      setTimeout(() => {
        button.style.transform = "";
      }, 200);
    });
  });
});