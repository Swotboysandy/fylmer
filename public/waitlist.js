(() => {
  const popup = document.querySelector("[data-waitlist-popup]");
  if (!popup) return;

  const storageKey = "fylmer:founding-offer-dismissed";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dismissed = false;

  try {
    dismissed = window.localStorage.getItem(storageKey) === "true";
  } catch {}

  if (dismissed) return;

  const show = () => {
    popup.hidden = false;
    requestAnimationFrame(() => popup.classList.add("is-visible"));
  };

  const dismiss = () => {
    popup.classList.remove("is-visible");
    try { window.localStorage.setItem(storageKey, "true"); } catch {}
    window.setTimeout(() => { popup.hidden = true; }, reducedMotion ? 0 : 240);
  };

  popup.querySelector("[data-waitlist-close]")?.addEventListener("click", dismiss);
  popup.querySelector("[data-waitlist-cta]")?.addEventListener("click", () => {
    try { window.localStorage.setItem(storageKey, "true"); } catch {}
  });

  window.setTimeout(show, reducedMotion ? 0 : 3500);
})();
