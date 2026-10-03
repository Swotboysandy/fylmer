(function () {
  const root = document.documentElement;
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#111111" : "#ffffff");
    const compactShell = document.querySelector(".top-nav.is-scrolled .nav-shell");
    if (compactShell) {
      compactShell.style.backgroundColor = theme === "dark" ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.92)";
      compactShell.style.boxShadow = theme === "dark" ? "0 12px 36px rgba(0,0,0,0.34)" : "0 12px 36px rgba(10,20,40,0.14)";
    }
    try { window.localStorage.setItem("fylmer-theme", theme); } catch {}
  };

  const toggle = () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyTheme(next);
      return;
    }

    root.dataset.beuiVt = "blinds";
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.finished.finally(() => {
      delete root.dataset.beuiVt;
    });
  };

  applyTheme(root.dataset.theme === "dark" ? "dark" : "light");
  button.addEventListener("click", toggle);
})();

(function () {
  const wraps = document.querySelectorAll(".flow-button-wrap");

  const roundedRectPath = (width, height, radius) =>
    `M${radius},0.5 H${width - radius} A${radius},${radius} 0 0 1 ${width - 0.5},${radius} V${
      height - radius
    } A${radius},${radius} 0 0 1 ${width - radius},${height - 0.5} H${radius} A${radius},${radius} 0 0 1 0.5,${
      height - radius
    } V${radius} A${radius},${radius} 0 0 1 ${radius},0.5 Z`;

  wraps.forEach((wrap) => {
    const button = wrap.querySelector(".button-primary");
    const svg = wrap.querySelector("svg");
    const path = wrap.querySelector("path");

    const measure = () => {
      const width = button.offsetWidth;
      const height = button.offsetHeight;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      path.setAttribute("d", roundedRectPath(width, height, 10));
    };

    measure();
    new ResizeObserver(measure).observe(button);
  });
})();

(async function () {
  const header = document.querySelector("[data-site-header]");
  const menu = document.querySelector("[data-mega-menu]");
  const triggers = Array.from(document.querySelectorAll("[data-menu-trigger]"));
  if (!header || !menu || !triggers.length) return;

  const { animate } = await import("https://cdn.jsdelivr.net/npm/motion@12.23.24/+esm");
  let open = false;
  let closeTimer = 0;
  let scrolled = false;

  const headerSizes = () => {
    const viewportWidth = document.documentElement.clientWidth;
    return {
      heroWidth: viewportWidth,
      compactWidth: Math.min(viewportWidth - 32, 860),
      heroPadding: Math.max(20, Math.min(viewportWidth * 0.032, 64)),
    };
  };

  const setHeaderState = () => {
    const nextScrolled = window.scrollY > Math.max(80, window.innerHeight * 0.54);
    if (nextScrolled === scrolled) return;
    scrolled = nextScrolled;
    const sizes = headerSizes();
    header.classList.toggle("is-scrolled", scrolled);

    animate(
      header,
      scrolled
        ? {
            width: `${sizes.compactWidth}px`,
            marginTop: "16px",
            paddingLeft: "0px",
            paddingRight: "0px",
          }
        : {
            width: `${sizes.heroWidth}px`,
            marginTop: "0px",
            paddingLeft: `${sizes.heroPadding}px`,
            paddingRight: `${sizes.heroPadding}px`,
          },
      { duration: 0.44, easing: [0.16, 1, 0.3, 1] }
    );

    animate(
      header.querySelector(".nav-shell"),
      scrolled
        ? {
            backgroundColor: document.documentElement.dataset.theme === "dark" ? "rgba(20,20,20,0.92)" : "rgba(255,255,255,0.92)",
            boxShadow: document.documentElement.dataset.theme === "dark" ? "0 12px 36px rgba(0,0,0,0.34)" : "0 12px 36px rgba(10,20,40,0.14)",
            borderRadius: "18px",
            transform: ["translateY(-10px) scale(0.985)", "translateY(0) scale(1)"],
          }
        : {
            backgroundColor: "rgba(255,255,255,0)",
            boxShadow: "0 0 0 rgba(10,20,40,0)",
            borderRadius: "18px",
            transform: ["translateY(4px) scale(1.01)", "translateY(0) scale(1)"],
          },
      { duration: 0.44, easing: [0.16, 1, 0.3, 1] }
    );
  };

  const setActive = (trigger) => {
    triggers.forEach((item) => item.classList.toggle("is-active", item === trigger));
  };

  const openMenu = (trigger) => {
    window.clearTimeout(closeTimer);
    setActive(trigger);
    if (open) return;
    open = true;
    menu.classList.add("is-open");
    animate(
      menu,
      {
        opacity: [0, 1],
        transform: [
          "translateX(-50%) translateY(-8px) scale(0.985)",
          "translateX(-50%) translateY(0) scale(1)",
        ],
      },
      { duration: 0.28, easing: [0.16, 1, 0.3, 1] }
    );
    animate(
      menu.querySelectorAll(".mega-card, .mega-footer"),
      { opacity: [0, 1], transform: ["translateY(10px)", "translateY(0)"] },
      { delay: 0.05, duration: 0.34, easing: [0.16, 1, 0.3, 1] }
    );
  };

  const closeMenu = () => {
    closeTimer = window.setTimeout(() => {
      open = false;
      animate(
        menu,
        { opacity: 0, transform: "translateX(-50%) translateY(-8px) scale(0.985)" },
        { duration: 0.18, easing: [0.77, 0, 0.175, 1] }
      ).finished.then(() => {
        if (!open) menu.classList.remove("is-open");
      });
    }, 120);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", () => openMenu(trigger));
    trigger.addEventListener("focus", () => openMenu(trigger));
    trigger.addEventListener("click", () => open ? closeMenu() : openMenu(trigger));
  });

  header.addEventListener("mouseleave", closeMenu);
  header.addEventListener("mouseenter", () => window.clearTimeout(closeTimer));
  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();
})();

(function () {
  const toggle = document.querySelector("[data-mobile-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("click", (event) => {
    if (!menu.classList.contains("is-open")) return;
    if (!menu.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setOpen(false);
  });
})();

(function () {
  const carousel = document.querySelector("[data-logos-carousel]");
  if (!carousel) return;

  const logos = Array.from({ length: 13 }, (_, index) => {
    const file = `partner-${String(index + 1).padStart(2, "0")}.svg`;
    return `<img class="brand-logo-img" src="./assets/brand-logos/supplied/${file}" alt="" />`;
  });

  const slots = Array.from({ length: 4 }, (_, index) => {
    const slot = document.createElement("div");
    slot.className = "logo-slot";
    slot.style.setProperty("--delay", `${index * 110}ms`);
    carousel.appendChild(slot);
    return slot;
  });

  const groups = Array.from({ length: Math.ceil(logos.length / slots.length) }, (_, groupIndex) =>
    slots.map((_, slotIndex) => logos[(groupIndex * slots.length + slotIndex) % logos.length]),
  );
  let groupIndex = 0;

  const renderGroup = () => {
    slots.forEach((slot, index) => {
      slot.innerHTML = groups[groupIndex][index];
    });
  };

  const swapGroup = () => {
    carousel.classList.add("is-swapping");
    window.setTimeout(() => {
      groupIndex = (groupIndex + 1) % groups.length;
      renderGroup();
      carousel.classList.remove("is-swapping");
    }, 430);
  };

  renderGroup();
  window.setInterval(swapGroup, 2500);
})();

(function () {
  const root = document.querySelector("[data-platform-showcase]");
  if (!root) return;

  const products = {
    creative: {
      label: "Creative features",
      video: "/assets/platform-loops/creative.webm",
      features: ["How Fylmer is used", "Direct a scene", "Build visual worlds", "Review every take"],
    },
    dev: {
      label: "Developer features",
      video: "/assets/platform-loops/dev.webm",
      features: ["Production-ready API", "Route creative models", "Stream live progress", "Keep generation state"],
    },
    production: {
      label: "Production features",
      features: [
        { label: "Plan the whole story", video: "/assets/platform-loops/production-plan.webm" },
        { label: "Preserve continuity", video: "/assets/platform-loops/production-continuity.webm" },
        { label: "Collaborate on review", video: "/assets/platform-loops/dev.webm" },
        { label: "Deliver the final cut", video: "/assets/platform-loops/production-delivery.webm" },
      ],
    },
  };

  const productButtons = Array.from(root.querySelectorAll("[data-showcase-product]"));
  const featureList = root.querySelector("[data-showcase-features]");
  const video = root.querySelector("[data-showcase-video]");
  const source = video?.querySelector("source");
  if (!featureList || !video || !source) return;

  let autoAdvanceId;

  const stopAutoAdvance = () => {
    window.clearInterval(autoAdvanceId);
  };

  const startAutoAdvance = () => {
    stopAutoAdvance();
    autoAdvanceId = window.setInterval(() => {
      const buttons = Array.from(featureList.querySelectorAll("button"));
      const activeIndex = buttons.findIndex((item) => item.classList.contains("is-active"));
      selectFeature(buttons[(activeIndex + 1) % buttons.length]);
    }, 2000);
  };

  const selectFeature = (button, restartTimer = false) => {
    featureList.querySelectorAll("button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", String(selected));
    });
    const nextVideo = button.dataset.video;
    if (nextVideo && source.getAttribute("src") !== nextVideo) {
      source.setAttribute("src", nextVideo);
      video.load();
      video.play().catch(() => {});
    }
    if (restartTimer) startAutoAdvance();
  };

  const selectProduct = (key) => {
    const product = products[key];
    if (!product) return;

    productButtons.forEach((button) => {
      const selected = button.dataset.showcaseProduct === key;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
    });

    featureList.setAttribute("aria-label", product.label);
    featureList.replaceChildren(...product.features.map((feature, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "tab";
      button.textContent = feature.label;
      button.dataset.video = feature.video;
      button.classList.toggle("is-active", index === 0);
      button.setAttribute("aria-selected", String(index === 0));
      button.addEventListener("click", () => selectFeature(button, true));
      return button;
    }));

    const firstVideo = product.features[0].video;
    if (source.getAttribute("src") !== firstVideo) {
      source.setAttribute("src", firstVideo);
      video.load();
      video.play().catch(() => {});
    }
  };

  productButtons.forEach((button) => {
    button.addEventListener("click", () => selectProduct(button.dataset.showcaseProduct));
  });

  selectProduct("production");
  startAutoAdvance();
})();

(async function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { default: Lenis } = await import("https://cdn.jsdelivr.net/npm/lenis@1.3.17/+esm");
  new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.075,
    wheelMultiplier: 0.92,
    touchMultiplier: 1,
    syncTouch: false,
    anchors: { offset: -88 },
  });
})();
