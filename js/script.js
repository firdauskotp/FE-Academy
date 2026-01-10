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

  // ===== REVIEWS (Google Sheets CSV -> Carousel + Auto-slide) =====
const REVIEWS_CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQvmN-is89yUxisJX_lAg61zqU2_dN6Y6S7aNS-ZQFq-qKW2MOGQOOhynNMyJ6LWkvkIIIC1B3WrDRH/pub?gid=1253076960&single=true&output=csv";

  const revTrack = document.getElementById("revTrack");
  const revDots = document.getElementById("revDots");
  const revPrev = document.querySelector(".rev-prev");
  const revNext = document.querySelector(".rev-next");
  const revViewport = document.querySelector(".rev-viewport");

  if (!revTrack || !revDots || !revPrev || !revNext || !revViewport) {
    console.warn("[Reviews] Missing carousel elements. Check IDs/classes in HTML.", {
      revTrack, revDots, revPrev, revNext, revViewport
    });
    return;
  }

  let revIndex = 0;
  let reviews = [];

  // Auto-slide every 5 seconds
  let autoTimer = null;
  const AUTO_MS = 5000;

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // CSV parser (handles quoted commas)
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"' && inQuotes && next === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuotes = !inQuotes; continue; }

      if (ch === "," && !inQuotes) { row.push(cur); cur = ""; continue; }

      if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && next === "\n") i++;
        row.push(cur);
        if (row.some(cell => cell.trim() !== "")) rows.push(row);
        row = [];
        cur = "";
        continue;
      }
      cur += ch;
    }

    row.push(cur);
    if (row.some(cell => cell.trim() !== "")) rows.push(row);
    return rows;
  }

  function starHtml(rating) {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += i <= r ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
    }
    return html;
  }

  function updateReviews() {
    revTrack.style.transform = `translateX(-${revIndex * 100}%)`;

    const dots = revDots.querySelectorAll(".rev-dot");
    dots.forEach((d, i) => d.classList.toggle("active", i === revIndex));

    revPrev.disabled = revIndex === 0;
    revNext.disabled = revIndex === reviews.length - 1;
  }

  function startAutoSlide() {
    if (autoTimer) clearInterval(autoTimer);
    if (!reviews.length) return;

    autoTimer = setInterval(() => {
      revIndex = (revIndex + 1) % reviews.length;
      updateReviews();
    }, AUTO_MS);
  }

  function renderReviews() {
    if (!reviews.length) {
      revTrack.innerHTML = `
        <div class="rev-slide">
          <div class="rev-card">
            <p class="muted">No approved reviews yet. Be the first to leave one!</p>
          </div>
        </div>`;
      revDots.innerHTML = "";
      revPrev.disabled = true;
      revNext.disabled = true;
      if (autoTimer) clearInterval(autoTimer);
      return;
    }

    revTrack.innerHTML = reviews.map(r => `
      <div class="rev-slide">
        <div class="rev-card">
          <div class="rev-stars">${starHtml(r.rating)}</div>
          <p class="rev-text">"${escapeHtml(r.help)}"</p>
          <div class="rev-meta">
            <span class="rev-pill"><i class="fa-solid fa-user"></i> ${escapeHtml(r.name)}</span>
            <span class="rev-pill"><i class="fa-solid fa-layer-group"></i> ${escapeHtml(r.plan)}</span>
          </div>
        </div>
      </div>
    `).join("");

    revDots.innerHTML = reviews.map((_, i) => `
      <button class="rev-dot ${i === 0 ? "active" : ""}" type="button" aria-label="Go to review ${i + 1}"></button>
    `).join("");

    revDots.querySelectorAll(".rev-dot").forEach((dot, i) => {
      dot.addEventListener("click", () => {
        revIndex = i;
        updateReviews();
        startAutoSlide();
      });
    });

    revIndex = 0;
    updateReviews();
    startAutoSlide();
  }

  // Buttons
  revPrev.addEventListener("click", () => {
    revIndex = Math.max(0, revIndex - 1);
    updateReviews();
    startAutoSlide();
  });

  revNext.addEventListener("click", () => {
    revIndex = Math.min(reviews.length - 1, revIndex + 1);
    updateReviews();
    startAutoSlide();
  });

  // Pause on hover (desktop)
  revViewport.addEventListener("mouseenter", () => autoTimer && clearInterval(autoTimer));
  revViewport.addEventListener("mouseleave", () => startAutoSlide());

  // Swipe support (mobile)
  let startX2 = null;
  revViewport.addEventListener("touchstart", (e) => { startX2 = e.touches[0].clientX; }, { passive: true });
  revViewport.addEventListener("touchend", (e) => {
    if (startX2 === null) return;
    const dx = e.changedTouches[0].clientX - startX2;
    if (dx > 50) { revIndex = Math.max(0, revIndex - 1); updateReviews(); startAutoSlide(); }
    else if (dx < -50) { revIndex = Math.min(reviews.length - 1, revIndex + 1); updateReviews(); startAutoSlide(); }
    startX2 = null;
  }, { passive: true });

  async function loadReviews() {
    try {
      const res = await fetch(REVIEWS_CSV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const csv = await res.text();
      const rows = parseCSV(csv);

      console.log("[Reviews] Rows fetched:", rows.length);

      if (rows.length < 2) {
        reviews = [];
        renderReviews();
        return;
      }

      // Clean headers (strip BOM)
      const header = rows[0].map(h =>
        String(h ?? "").replace(/^\uFEFF/, "").trim().toLowerCase()
      );

      console.log("[Reviews] Headers:", header);

      // Flexible header matching
      const idxName = header.findIndex(h => h === "name");
      const idxPlan = header.findIndex(h => h.includes("plan"));
      const idxRating = header.findIndex(h => h.includes("rating"));
      const idxHelp = header.findIndex(h => h.includes("how did") || h.includes("help you") || h.includes("gain"));

      // Fallback to fixed positions if headers don't match:
      // PublicReviews output order should be: Name, Plan, Rating, HelpText
      const fallback = {
        name: 0,
        plan: 1,
        rating: 2,
        help: 3
      };

      const useIdx = {
        name: idxName !== -1 ? idxName : fallback.name,
        plan: idxPlan !== -1 ? idxPlan : fallback.plan,
        rating: idxRating !== -1 ? idxRating : fallback.rating,
        help: idxHelp !== -1 ? idxHelp : fallback.help
      };

      reviews = rows.slice(1).map(r => ({
        name: (r[useIdx.name] ?? "").trim(),
        plan: (r[useIdx.plan] ?? "").trim(),
        rating: (r[useIdx.rating] ?? "").trim(),
        help: (r[useIdx.help] ?? "").trim(),
      }))
      .filter(r => r.name && r.plan && r.rating && r.help);

      console.log("[Reviews] Parsed reviews:", reviews.length);

      renderReviews();
    } catch (err) {
      console.error("[Reviews] Error:", err);
      revTrack.innerHTML = `
        <div class="rev-slide">
          <div class="rev-card">
            <p class="muted">Could not load reviews right now.</p>
          </div>
        </div>`;
      if (autoTimer) clearInterval(autoTimer);
    }
  }

  loadReviews();

  });
  
