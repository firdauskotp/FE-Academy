document.addEventListener("DOMContentLoaded", () => {
    // ===== ELEMENTS =====
    const root = document.documentElement;
  
    // Theme switch (checkbox)
    const themeCheckbox = document.getElementById("themeToggle");
    const themeLabel = themeCheckbox ? themeCheckbox.nextElementSibling : null; // label.theme-toggle
  
    // Mobile menu
    const menuToggle = document.getElementById("menuToggle");
    const mobileMenu = document.getElementById("mobileMenu");
    const header = document.getElementById("siteHeader");
  
    // ===== THEME =====
    function applyTheme(theme) {
      root.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
  
      // Sync checkbox + aria state
      if (themeCheckbox) themeCheckbox.checked = theme === "dark";
      if (themeLabel) themeLabel.setAttribute("aria-checked", theme === "dark" ? "true" : "false");
    }
  
    // Initialise theme from saved preference
    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);
  
    // Toggle theme when switch changes
    if (themeCheckbox) {
      themeCheckbox.addEventListener("change", () => {
        applyTheme(themeCheckbox.checked ? "dark" : "light");
      });
    }
  
    // ===== MOBILE MENU =====
    function isMenuOpen() {
      return mobileMenu && mobileMenu.style.display === "block";
    }
  
    function openMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.style.display = "block";
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close menu");
    }
  
    function closeMenu() {
      if (!mobileMenu || !menuToggle) return;
      mobileMenu.style.display = "none";
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    }
  
    // Hamburger button
    if (menuToggle) {
      menuToggle.addEventListener("click", () => {
        isMenuOpen() ? closeMenu() : openMenu();
      });
    }
  
    // Close menu when clicking a link in mobile menu
    if (mobileMenu) {
      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
      });
    }
  
    // Close menu when clicking outside header (use capture for reliability)
    document.addEventListener(
      "click",
      (e) => {
        if (!header || !mobileMenu) return;
        if (!header.contains(e.target) && isMenuOpen()) closeMenu();
      },
      true
    );
  
    // Close menu on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isMenuOpen()) closeMenu();
    });
  
    // Close menu if resizing back to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860 && isMenuOpen()) closeMenu();
    });

      // ===== YOUTUBE CAROUSEL =====
  const ytTrack = document.getElementById("ytTrack");
  const ytDots = document.getElementById("ytDots");
  const prevBtn = document.querySelector(".yt-prev");
  const nextBtn = document.querySelector(".yt-next");

  // Put your YouTube VIDEO IDs here (not full links)
  // Example: https://www.youtube.com/watch?v=VIDEO_ID  -> "VIDEO_ID"
  const ytVideoIds = [
    "qgp4ROqcl94",
    "NgWAdIJv6jM",
    "Fqeen1QhSUs",
    "pTkIsrBjwwY",
    "MxRuGg5i4uA"
  ];

  let ytIndex = 0;

  function renderYtSlides() {
    if (!ytTrack || !ytDots) return;

    ytTrack.innerHTML = ytVideoIds.map(id => `
      <div class="yt-slide">
        <iframe
          class="yt-frame"
          src="https://www.youtube.com/embed/${id}"
          title="YouTube tutorial"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen></iframe>
      </div>
    `).join("");

    ytDots.innerHTML = ytVideoIds.map((_, i) => `
      <button class="yt-dot ${i === 0 ? "active" : ""}" type="button" aria-label="Go to video ${i + 1}"></button>
    `).join("");

    ytDots.querySelectorAll(".yt-dot").forEach((dot, i) => {
      dot.addEventListener("click", () => {
        ytIndex = i;
        updateYtCarousel();
      });
    });

    updateYtCarousel();
  }

  function updateYtCarousel() {
    if (!ytTrack || !ytDots) return;

    ytTrack.style.transform = `translateX(-${ytIndex * 100}%)`;

    const dots = ytDots.querySelectorAll(".yt-dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === ytIndex));

    if (prevBtn) prevBtn.disabled = ytIndex === 0;
    if (nextBtn) nextBtn.disabled = ytIndex === ytVideoIds.length - 1;
  }

  if (prevBtn) prevBtn.addEventListener("click", () => {
    ytIndex = Math.max(0, ytIndex - 1);
    updateYtCarousel();
  });

  if (nextBtn) nextBtn.addEventListener("click", () => {
    ytIndex = Math.min(ytVideoIds.length - 1, ytIndex + 1);
    updateYtCarousel();
  });

  // Optional: swipe support on mobile
  let startX = null;
  const viewport = document.querySelector(".yt-viewport");
  if (viewport) {
    viewport.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const endX = e.changedTouches[0].clientX;
      const dx = endX - startX;

      if (dx > 50) { // swipe right
        ytIndex = Math.max(0, ytIndex - 1);
        updateYtCarousel();
      } else if (dx < -50) { // swipe left
        ytIndex = Math.min(ytVideoIds.length - 1, ytIndex + 1);
        updateYtCarousel();
      }
      startX = null;
    }, { passive: true });
  }

  renderYtSlides();

  });
  