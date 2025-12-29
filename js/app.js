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
  });
  