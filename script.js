/* TIMDSGN: accessible interactions, existing motion and monochrome themes. */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const precise = matchMedia("(hover: hover) and (pointer: fine)");
  const menuButton = document.querySelector(".mobile-menu-btn");
  const navigation = document.querySelector(".nav-links");
  const navbar = document.querySelector(".navbar");
  if (menuButton && navigation) {
    root.classList.add("menu-enhanced");
    const closeMenu = (focus = false) => {
      navigation.classList.remove("active");
      menuButton.classList.remove("active");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Otvori izbornik");
      if (focus) menuButton.focus();
    };
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      navigation.classList.toggle("active", open);
      menuButton.classList.toggle("active", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute(
        "aria-label",
        open ? "Zatvori izbornik" : "Otvori izbornik",
      );
    });
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        menuButton.getAttribute("aria-expanded") === "true"
      )
        closeMenu(true);
    });
    document.addEventListener("click", (e) => {
      if (!navbar.contains(e.target)) closeMenu();
    });
    navbar.addEventListener("focusout", (e) => {
      if (!navbar.contains(e.relatedTarget)) closeMenu();
    });
    navigation.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });
    matchMedia("(min-width: 901px)").addEventListener("change", () =>
      closeMenu(),
    );
  }

  // One deterministic viewport probe governs light/dark state in both directions.
  const themeSections = [...document.querySelectorAll(".theme-trigger")];
  let scheduled = false;
  function updateScrollState() {
    scheduled = false;
    navbar?.classList.toggle("scrolled", scrollY > 50);
    const probe = innerHeight * 0.4;
    const light = themeSections.some((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= probe && rect.bottom > probe;
    });
    document.body.classList.toggle("theme-light", light);
  }
  function scheduleScroll() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScrollState);
    }
  }
  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll);
  addEventListener("load", scheduleScroll);
  updateScrollState();

  const motionButton = document.createElement("button");
  motionButton.type = "button";
  motionButton.className = "motion-toggle no-magnetic";
  motionButton.setAttribute("aria-pressed", "false");
  const motionHost =
    document.querySelector(".subpage-hero, .hero") ||
    document.querySelector("footer");
  motionHost?.append(motionButton);
  let paused = false;
  const tweens = [];
  function updateMotion() {
    root.classList.toggle("no-motion", reduced.matches);
    root.classList.toggle("motion-enabled", !reduced.matches);
    root.classList.toggle("motion-paused", paused || reduced.matches);
    motionButton.hidden = reduced.matches;
    motionButton.innerHTML = paused
      ? '<span aria-hidden="true">▶</span><span class="sr-only">Pokreni animacije</span>'
      : '<span aria-hidden="true">⏸</span><span class="sr-only">Pauziraj animacije</span>';
    motionButton.setAttribute(
      "aria-label",
      paused ? "Pokreni animacije" : "Pauziraj animacije",
    );
    motionButton.setAttribute("aria-pressed", String(paused));
    tweens.forEach((tween) => tween.paused(paused || reduced.matches));
    if (reduced.matches)
      document
        .querySelectorAll(".reveal-ready")
        .forEach((el) => el.classList.add("visible"));
  }
  motionButton.addEventListener("click", () => {
    paused = !paused;
    updateMotion();
  });
  reduced.addEventListener("change", updateMotion);
  if (typeof gsap !== "undefined") {
    document
      .querySelectorAll(".geometric-separator svg rect")
      .forEach((rect, i) => {
        tweens.push(
          gsap.to(rect, {
            x: i % 2 === 0 ? 20 : -20,
            duration: 3 + i * 0.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.2,
          }),
        );
      });
  }
  updateMotion();
  if ("IntersectionObserver" in window && !reduced.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((el) => {
      // Never hide text already in view, nor depend on an external animation library.
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add("reveal-ready");
        observer.observe(el);
      } else el.classList.add("visible");
    });
  }
  document.querySelectorAll(".btn:not(.no-magnetic)").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      if (!precise.matches || reduced.matches || paused) return;
      const rect = button.getBoundingClientRect();
      button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.1}px, ${(event.clientY - rect.top - rect.height / 2) * 0.1}px)`;
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });

  const form = document.querySelector(".contact-form");
  if (!form) return;
  const service = form.elements.service;
  const groups = [...form.querySelectorAll(".service-brief")];
  const status = form.querySelector(".form-status");
  const fallback = form.querySelector(".form-fallback");
  const submit = form.querySelector('[type="submit"]');
  let sending = false;
  const preselection = new URLSearchParams(location.search).get("usluga");
  if ([...service.options].some((option) => option.value === preselection))
    service.value = preselection;
  function updateService() {
    groups.forEach((group) => {
      group.hidden = group.dataset.service !== service.value;
      group.disabled = group.hidden;
    });
    scheduleScroll();
  }
  service.addEventListener("change", updateService);
  updateService();
  form.noValidate = true;
  function clearErrors() {
    form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    });
    form.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
    });
  }
  function fieldError(field, message) {
    const error = document.getElementById(`${field.id}-error`);
    if (error) {
      error.textContent = message;
      field.setAttribute("aria-describedby", error.id);
    }
    field.setAttribute("aria-invalid", "true");
  }
  form.addEventListener("input", (event) => {
    const el = event.target;
    el.removeAttribute("aria-invalid");
    el.removeAttribute("aria-describedby");
    const error = document.getElementById(`${el.id}-error`);
    if (error) error.textContent = "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    clearErrors();
    status.textContent = "";
    fallback.hidden = true;
    let invalid = null;
    for (const field of form.querySelectorAll("input,select,textarea")) {
      if (
        field.disabled ||
        field.closest("fieldset[disabled]") ||
        !field.willValidate
      )
        continue;
      if ((field.required && !field.value.trim()) || !field.validity.valid) {
        fieldError(
          field,
          field.validity.typeMismatch
            ? field.type === "url"
              ? "Unesite adresu koja počinje s https:// ili http://."
              : "Unesite valjanu e-mail adresu."
            : "Ispunite ovo polje.",
        );
        if (!invalid) invalid = field;
      }
    }
    if (invalid) {
      invalid.closest("details")?.setAttribute("open", "");
      invalid.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const enabledControls = [...form.elements].filter(
      (el) =>
        ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) &&
        !el.disabled &&
        !el.closest("fieldset[disabled]"),
    );
    sending = true;
    submit.disabled = true;
    enabledControls.forEach((el) => {
      el.disabled = true;
    });
    form.setAttribute("aria-busy", "true");
    submit.textContent = "Slanje upita…";
    status.textContent = "Šaljemo vaš upit…";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        if (result?.errors)
          for (const [name, message] of Object.entries(result.errors)) {
            const field = form.elements.namedItem(name);
            if (field) fieldError(field, message);
          }
        throw new Error(
          result?.message ||
            "Upit nije poslan. Pokušajte ponovno ili nam se javite izravno.",
        );
      }
      form.reset();
      status.textContent = "Vaš je upit poslan. Hvala što ste nam se javili.";
    } catch (error) {
      status.textContent =
        error.name === "AbortError"
          ? "Nismo mogli potvrditi slanje. Provjerite prije ponovnog pokušaja ili nam se javite izravno."
          : error.message;
      fallback.hidden = false;
    } finally {
      clearTimeout(timeout);
      sending = false;
      enabledControls.forEach((el) => {
        el.disabled = false;
      });
      submit.disabled = false;
      submit.innerHTML = 'Pošalji Upit <span aria-hidden="true">→</span>';
      form.removeAttribute("aria-busy");
      updateService();
      status.focus();
    }
  });
});
