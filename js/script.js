document.addEventListener("DOMContentLoaded", () => {
    // ===== FE ACADEMY REGISTRATION FORM =====
    // After running FE_Academy_Registration_Setup.gs, paste the responder URL here.
    // Paste the public responder URL from the Setup sheet below. All registration buttons use this same form.
    const REGISTRATION_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfBpWzyEipGyVawvFbktwec7U2Hjk8Sd3cN3kKuw0F1RQdW_A/viewform";

    document.querySelectorAll("[data-registration-link]").forEach((link) => {
      if (REGISTRATION_FORM_URL) {
        link.href = REGISTRATION_FORM_URL;
        link.target = "_blank";
        link.rel = "noopener";
        return;
      }

      link.addEventListener("click", (event) => {
        event.preventDefault();
        window.alert("The registration form link has not been connected yet. Paste the Google Form responder URL into REGISTRATION_FORM_URL in js/script.js.");
      });
    });

    // ===== LOCAL LANGUAGE SWITCHER (NO GOOGLE TRANSLATE) =====
    const translations = window.FE_TRANSLATIONS || {};
    const languageSwitcher = document.getElementById("languageSwitcher");
    const languageToggle = document.getElementById("languageToggle");
    const languageMenu = document.getElementById("languageMenu");
    const languageShort = languageToggle?.querySelector(".language-short");
    const languageLabels = { en: "EN", ms: "BM", "zh-CN": "中", ja: "日", ko: "한" };
    let currentLanguage = "en";
    const originalText = new WeakMap();

    const STATIC_TRANSLATION_SKIP = [
      ".notranslate", "[translate='no']", "code", "pre", "script", "style", "textarea", "select", "option", "input",
      "#languageMenu", "#revTrack", "#revDots", "#ytTrack", "#ytDots", ".plan-count", ".converted-price"
    ].join(",");

    function splitOuterWhitespace(value) {
      const match = String(value ?? "").match(/^(\s*)([\s\S]*?)(\s*)$/);
      return { leading: match?.[1] || "", core: match?.[2] || "", trailing: match?.[3] || "" };
    }

    function normalizeTranslationKey(value) {
      return String(value ?? "").replace(/\s+/g, " ").trim();
    }

    function collectStaticTextNodes() {
      const nodes = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue || !node.nodeValue.trim()) continue;
        const parent = node.parentElement;
        if (!parent || parent.closest(STATIC_TRANSLATION_SKIP)) continue;
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
        nodes.push(node);
      }
      return nodes;
    }

    function translatePhrase(english, language = currentLanguage) {
      if (language === "en") return english;
      const table = translations[language] || {};
      const key = normalizeTranslationKey(english);
      return table[english] || table[key] || english;
    }

    function translateCountLabels(language) {
      document.querySelectorAll("[data-plan-count] span").forEach((span) => {
        if (!span.dataset.englishCount) span.dataset.englishCount = span.textContent.trim();
        const source = span.dataset.englishCount;
        if (language === "en") {
          span.textContent = source;
          return;
        }

        const match = source.match(/^(\d+)\s+(.+)$/);
        if (!match) {
          span.textContent = translatePhrase(source, language);
          return;
        }
        const number = match[1];
        const label = match[2].toLowerCase();
        const countWords = {
          ms: { learner: "pelajar berdaftar", learners: "pelajar berdaftar", session: "sesi selesai", sessions: "sesi selesai" },
          "zh-CN": { learner: "名学习者已报名", learners: "名学习者已报名", session: "次课程已完成", sessions: "次课程已完成" },
          ja: { learner: "名受講中", learners: "名受講中", session: "回完了", sessions: "回完了" },
          ko: { learner: "명 등록", learners: "명 등록", session: "회 완료", sessions: "회 완료" }
        }[language] || {};
        let replacement = label;
        if (label.includes("learner")) replacement = countWords.learners || label;
        else if (label.includes("session")) replacement = countWords.sessions || label;
        span.textContent = `${number} ${replacement}`;
      });
    }

    function applyLanguage(language) {
      currentLanguage = translations[language] || language === "en" ? language : "en";
      const table = translations[currentLanguage] || {};

      collectStaticTextNodes().forEach((node) => {
        const source = originalText.get(node) ?? node.nodeValue;
        const parts = splitOuterWhitespace(source);
        const key = normalizeTranslationKey(parts.core);
        const translated = currentLanguage === "en" ? parts.core : (table[parts.core] || table[key] || parts.core);
        node.nodeValue = `${parts.leading}${translated}${parts.trailing}`;
      });

      document.documentElement.lang = currentLanguage === "zh-CN" ? "zh-CN" : currentLanguage;
      document.documentElement.dir = "ltr";
      if (languageShort) languageShort.textContent = languageLabels[currentLanguage] || "EN";
      document.querySelectorAll("[data-language]").forEach((button) => {
        const active = button.dataset.language === currentLanguage;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      translateCountLabels(currentLanguage);
      syncProgrammeBrowserLabel();
      if (typeof renderConvertedPrices === "function" && currentCurrency !== "MYR") renderConvertedPrices();
    }

    function closeLanguageMenu() {
      if (!languageSwitcher || !languageToggle) return;
      languageSwitcher.classList.remove("open");
      languageToggle.setAttribute("aria-expanded", "false");
      if (languageMenu) languageMenu.style.transform = "";
    }

    function keepLanguageMenuOnScreen() {
      if (!languageMenu || !languageSwitcher?.classList.contains("open")) return;
      languageMenu.style.transform = "";
      requestAnimationFrame(() => {
        const rect = languageMenu.getBoundingClientRect();
        const gap = 8;
        let shift = 0;
        if (rect.left < gap) shift = gap - rect.left;
        if (rect.right > innerWidth - gap) shift = (innerWidth - gap) - rect.right;
        if (shift) languageMenu.style.transform = `translateX(${shift}px)`;
      });
    }

    if (languageToggle && languageSwitcher) {
      languageToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = languageSwitcher.classList.toggle("open");
        languageToggle.setAttribute("aria-expanded", String(open));
        if (open) keepLanguageMenuOnScreen();
      });
      document.addEventListener("click", (event) => {
        if (!languageSwitcher.contains(event.target)) closeLanguageMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeLanguageMenu();
      });
      window.addEventListener("resize", keepLanguageMenuOnScreen);
    }

    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        applyLanguage(button.dataset.language || "en");
        closeLanguageMenu();
      });
    });

    // ===== PROGRAMME LIST BUTTON =====
    const programmeBrowserToggle = document.getElementById("programmeBrowserToggle");
    const programmeGrid = document.getElementById("programmeGrid");

    function syncProgrammeBrowserLabel() {
      if (!programmeBrowserToggle || !programmeGrid) return;
      const isOpen = !programmeGrid.hidden;
      const show = programmeBrowserToggle.querySelector(".programme-show-label");
      const hide = programmeBrowserToggle.querySelector(".programme-hide-label");
      if (show) show.textContent = translatePhrase("Show programmes");
      if (hide) hide.textContent = translatePhrase("Hide programmes");
      programmeBrowserToggle.setAttribute("aria-expanded", String(isOpen));
    }

    if (programmeBrowserToggle && programmeGrid) {
      programmeBrowserToggle.addEventListener("click", () => {
        const willOpen = programmeGrid.hidden;
        programmeGrid.hidden = !willOpen;
        if (!willOpen) {
          programmeGrid.querySelectorAll("details.course-card[open]").forEach((card) => card.removeAttribute("open"));
        }
        syncProgrammeBrowserLabel();
      });
      programmeGrid.hidden = true;
      syncProgrammeBrowserLabel();
    }

    // ===== LIVE CURRENCY REFERENCE =====
    const currencySelect = document.getElementById("currencySelect");
    const currencyStatus = document.getElementById("currencyStatus");
    const priceElements = Array.from(document.querySelectorAll("[data-myr-price]"));
    const FX_CACHE_KEY = "fe-academy-myr-fx-cache-v2";
    const FX_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // last-known fallback only
    let currentRate = 1;
    let currentCurrency = "MYR";
    let activeCurrencyRequest = 0;

    function clearConvertedPrices() {
      document.querySelectorAll(".converted-price").forEach((node) => node.remove());
    }

    function renderConvertedPrices() {
      clearConvertedPrices();
      if (currentCurrency === "MYR" || !Number.isFinite(currentRate)) return;

      const locale = currentLanguage === "ms"
        ? "ms-MY"
        : currentLanguage === "ja"
          ? "ja-JP"
          : currentLanguage === "ko"
            ? "ko-KR"
            : currentLanguage === "zh-CN"
              ? "zh-CN"
              : "en-US";

      priceElements.forEach((element) => {
        const myr = Number(element.dataset.myrPrice);
        if (!Number.isFinite(myr)) return;

        const converted = myr * currentRate;
        const note = document.createElement("small");
        note.className = "converted-price";
        note.textContent = `≈ ${new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currentCurrency,
          maximumFractionDigits: ["JPY", "KRW", "IDR"].includes(currentCurrency) ? 0 : 2
        }).format(converted)}`;
        element.insertAdjacentElement("afterend", note);
      });
    }

    function readFxCache(currency) {
      try {
        const raw = localStorage.getItem(FX_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        const item = cache?.rates?.[currency];
        if (!item || !Number.isFinite(Number(item.rate))) return null;
        return {
          rate: Number(item.rate),
          date: item.date || "",
          savedAt: Number(item.savedAt) || 0
        };
      } catch (error) {
        return null;
      }
    }

    function saveFxCache(currency, rate, date) {
      try {
        const raw = localStorage.getItem(FX_CACHE_KEY);
        const cache = raw ? JSON.parse(raw) : { rates: {} };
        if (!cache.rates || typeof cache.rates !== "object") cache.rates = {};
        cache.rates[currency] = { rate, date: date || "", savedAt: Date.now() };
        localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache));
      } catch (error) {
        // Conversion still works when storage is blocked; only the fallback cache is skipped.
      }
    }

    async function fetchJsonWithTimeout(url, timeoutMs = 8000) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } finally {
        window.clearTimeout(timer);
      }
    }

    async function fetchLiveMyrRate(currency) {
      // Primary: Frankfurter's current v2 API.
      try {
        const data = await fetchJsonWithTimeout(
          `https://api.frankfurter.dev/v2/rate/MYR/${encodeURIComponent(currency)}`
        );
        const rate = Number(data?.rate);
        if (Number.isFinite(rate) && rate > 0) {
          return { rate, date: data?.date || "", source: "v2" };
        }
        throw new Error("v2 rate unavailable");
      } catch (primaryError) {
        // Fallback: Frankfurter v1 remains supported and uses a different response shape.
        const data = await fetchJsonWithTimeout(
          `https://api.frankfurter.dev/v1/latest?base=MYR&symbols=${encodeURIComponent(currency)}`
        );
        const rate = Number(data?.rates?.[currency]);
        if (!Number.isFinite(rate) || rate <= 0) throw primaryError;
        return { rate, date: data?.date || "", source: "v1" };
      }
    }

    async function updateCurrency(currency) {
      const requestId = ++activeCurrencyRequest;
      currentCurrency = currency;

      if (currency === "MYR") {
        currentRate = 1;
        clearConvertedPrices();
        if (currencyStatus) currencyStatus.textContent = translatePhrase("Select a currency to see approximate conversions.");
        return;
      }

      if (currencyStatus) currencyStatus.textContent = translatePhrase("Loading exchange rate…");

      try {
        const live = await fetchLiveMyrRate(currency);
        if (requestId !== activeCurrencyRequest || currentCurrency !== currency) return;

        currentRate = live.rate;
        saveFxCache(currency, live.rate, live.date);
        renderConvertedPrices();
        if (currencyStatus) {
          currencyStatus.textContent = live.date
            ? `${translatePhrase("Approximate reference rate")} · ${translatePhrase("Updated")} ${live.date}`
            : translatePhrase("Approximate live reference rate");
        }
      } catch (error) {
        if (requestId !== activeCurrencyRequest || currentCurrency !== currency) return;

        const cached = readFxCache(currency);
        if (cached && Date.now() - cached.savedAt <= FX_CACHE_MAX_AGE) {
          currentRate = cached.rate;
          renderConvertedPrices();
          if (currencyStatus) {
            currencyStatus.textContent = cached.date
              ? `${translatePhrase("Live rate unavailable")} · ${translatePhrase("Using saved reference from")} ${cached.date}`
              : `${translatePhrase("Live rate unavailable")} · ${translatePhrase("Using a recently saved reference rate")}`;
          }
          console.info("[Currency] Live rate unavailable; using cached rate", error);
          return;
        }

        currentRate = NaN;
        clearConvertedPrices();
        if (currencyStatus) currencyStatus.textContent = translatePhrase("Live conversion is unavailable right now. RM prices remain the official fees.");
        console.info("[Currency] Conversion unavailable", error);
      }
    }

    if (currencySelect) {
      currencySelect.addEventListener("change", () => updateCurrency(currencySelect.value));
    }

    // Always start in authored English. No language is saved between visits.
    collectStaticTextNodes();
    applyLanguage("en");

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

  // ===== PUBLIC PLAN & SESSION COUNTS =====
  // Default local file. After creating the Google Sheet, publish only the
  // Public Counts tab as CSV and paste that URL below.
  const PLAN_COUNTS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1rMvnBc1S2S2VHhjRJzNXocvolCqdIebaLbqXVgGY0V9qELiA9xMKaYqCr0B0boQHwtcJc_0oXXnA/pub?gid=1768616794&single=true&output=csv";

  function parseSimpleCSV(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i++;
        row.push(cell.trim());
        if (row.some(value => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell.trim());
    if (row.some(value => value !== "")) rows.push(row);
    return rows;
  }

  async function loadPlanCounts() {
    const countElements = document.querySelectorAll("[data-plan-count]");
    if (!countElements.length || !PLAN_COUNTS_CSV_URL) return;

    try {
      const response = await fetch(PLAN_COUNTS_CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rows = parseSimpleCSV(await response.text());
      if (rows.length < 2) return;

      const headers = rows[0].map(value => value.toLowerCase().trim());
      const keyIndex = headers.includes("key") ? headers.indexOf("key") : headers.indexOf("plan");
      const countIndex = headers.indexOf("count");
      const singularIndex = headers.indexOf("singular");
      const pluralIndex = headers.indexOf("plural");
      if (keyIndex === -1 || countIndex === -1) return;

      const counts = new Map();
      rows.slice(1).forEach(row => {
        const key = (row[keyIndex] || "").toLowerCase().trim();
        const rawCount = (row[countIndex] || "").trim();
        if (!key || rawCount === "") return;

        const count = Number.parseInt(rawCount, 10);
        if (!Number.isFinite(count) || count < 0) return;

        counts.set(key, {
          count,
          singular: singularIndex >= 0 ? (row[singularIndex] || "item") : "learner enrolled",
          plural: pluralIndex >= 0 ? (row[pluralIndex] || "items") : "learners enrolled"
        });
      });

      countElements.forEach(element => {
        const key = element.dataset.planCount;
        if (!counts.has(key)) return;

        const entry = counts.get(key);
        const label = entry.count === 1 ? entry.singular : entry.plural;
        const text = element.querySelector("span");
        if (text) text.textContent = `${entry.count} ${label}`;
        element.classList.add("has-count");
        const textNode = element.querySelector("span");
        if (textNode) textNode.dataset.englishCount = textNode.textContent.trim();
      });
      translateCountLabels(currentLanguage);
    } catch (error) {
      console.info("[Counts] Public counts are not available yet.", error);
    }
  }

  loadPlanCounts();

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
  
