(() => {
  const popup = document.querySelector("[data-waitlist-popup]");
  if (!popup) return;

  const storageKey = "fylmer:founding-offer-dismissed";
  const form = popup.querySelector("[data-waitlist-form]");
  const status = popup.querySelector("[data-waitlist-status]");
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
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const website = String(data.get("website") || "").trim();
    const button = form.querySelector("button");

    if (!email || !form.reportValidity()) return;
    button.disabled = true;
    button.textContent = "Joining…";
    status.textContent = "";

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not join right now.");

      form.hidden = true;
      status.textContent = result.existing
        ? "You’re already on the list. We’ll keep your founding offer ready."
        : "You’re on the list. We’ll email you when founding access opens.";
      status.classList.add("is-success");
      try { window.localStorage.setItem(storageKey, "true"); } catch {}
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Could not join right now.";
      button.disabled = false;
      button.innerHTML = 'Join the waitlist <span aria-hidden="true">↗</span>';
    }
  });

  window.setTimeout(show, reducedMotion ? 0 : 3500);
})();
