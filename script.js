/* TIMDSGN: accessible interactions, existing motion and monochrome themes. */

(() => {
  const storageKey = "timdsgn:intro-seen-v1";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const shouldShow = root.classList.contains("intro-pending");

  if (!shouldShow) return;

  try {
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // If session storage is blocked, the early head check leaves the intro off.
  }

  if (reduced.matches) {
    root.classList.remove("intro-pending");
    return;
  }

  const scriptUrl = document.currentScript?.src || location.href;
  const videoUrl = new URL(
    "resources/TIMDSGN%20%E2%80%94%20Kinetic%20Typography%20Intro.mp4",
    scriptUrl,
  );
  const language = root.lang.toLowerCase().startsWith("en") ? "en" : "hr";
  const intro = document.createElement("div");
  const video = document.createElement("video");
  const skip = document.createElement("button");
  const pageChildren = [...document.body.children].map((element) => ({
    element,
    wasInert: element.inert,
  }));
  let finished = false;
  let warmupStarted = false;

  function warmUpPage() {
    if (warmupStarted) return;
    warmupStarted = true;

    // The intro is useful loading time: request lazy images now and decode any
    // that arrive before the overlay closes. Keep their priority below video.
    document.querySelectorAll("img[src], img[srcset]").forEach((image) => {
      image.loading = "eager";
      image.fetchPriority = "low";
      image.decode?.().catch(() => undefined);
    });

    // Warm the HTTP cache for internal pages without delaying or extending the
    // intro. Skip speculative traffic for data-saver and very slow connections.
    const connection = navigator.connection;
    const constrainedConnection =
      connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || "");
    if (constrainedConnection) return;

    const destinations = new Set();
    document.querySelectorAll("a[href]").forEach((link) => {
      const destination = new URL(link.href, location.href);
      const isInternalPage =
        destination.origin === location.origin &&
        (destination.pathname.endsWith(".html") ||
          destination.pathname.endsWith("/"));

      if (isInternalPage && destination.pathname !== location.pathname) {
        destination.hash = "";
        destinations.add(destination.href);
      }
    });

    const prefetchNext = () => {
      const href = destinations.values().next().value;
      if (!href) return;
      destinations.delete(href);

      const hint = document.createElement("link");
      hint.rel = "prefetch";
      hint.as = "document";
      hint.href = href;
      hint.fetchPriority = "low";
      document.head.append(hint);

      if ("requestIdleCallback" in window) {
        requestIdleCallback(prefetchNext, { timeout: 1000 });
      } else {
        setTimeout(prefetchNext, 150);
      }
    };

    if ("requestIdleCallback" in window) {
      requestIdleCallback(prefetchNext, { timeout: 800 });
    } else {
      setTimeout(prefetchNext, 100);
    }
  }

  intro.className = "site-intro";
  intro.setAttribute("role", "dialog");
  intro.setAttribute("aria-modal", "true");
  intro.setAttribute("aria-label", language === "en" ? "Website intro" : "Uvod u stranicu");

  video.className = "site-intro__video";
  video.src = videoUrl.href;
  video.fetchPriority = "high";
  video.autoplay = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");

  skip.className = "site-intro__skip";
  skip.type = "button";
  skip.textContent = language === "en" ? "Skip" : "Preskoči";

  pageChildren.forEach(({ element }) => {
    element.inert = true;
  });
  intro.append(video, skip);
  document.body.prepend(intro);
  root.classList.remove("intro-pending");
  root.classList.add("intro-active");

  const safetyTimer = setTimeout(() => finish(), 12000);

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(safetyTimer);
    document.removeEventListener("keydown", handleKeydown);
    video.pause();
    intro.classList.add("site-intro--closing");
    setTimeout(() => {
      intro.remove();
      pageChildren.forEach(({ element, wasInert }) => {
        element.inert = wasInert;
      });
      root.classList.remove("intro-active");
    }, 550);
  }

  function handleKeydown(event) {
    if (event.key === "Escape") finish();
  }

  video.addEventListener("ended", finish, { once: true });
  video.addEventListener("error", finish, { once: true });
  video.addEventListener("playing", warmUpPage, { once: true });
  skip.addEventListener("click", finish);
  document.addEventListener("keydown", handleKeydown);

  video.play().catch(finish);
})();

(() => {
  const storageKey = "timdsgn:page-transition";
  const originKey = `${storageKey}:origin`;
  const duration = 520;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let leaving = false;

  function createCurtain(origin, covered = false) {
    const curtain = document.createElement("div");
    curtain.className = "page-transition-curtain";
    curtain.setAttribute("aria-hidden", "true");
    const iris = document.createElement("span");
    iris.className = "page-transition-iris";
    const x = origin.x * innerWidth;
    const y = origin.y * innerHeight;
    // Reach the farthest corner, including clicks near the viewport edges.
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    ) + 2;
    const closed = `circle(0px at ${origin.x * 100}% ${origin.y * 100}%)`;
    const open = `circle(${radius}px at ${origin.x * 100}% ${origin.y * 100}%)`;
    iris.style.clipPath = covered ? open : closed;
    curtain.append(iris);
    document.body.append(curtain);
    return { curtain, iris, closed, open };
  }

  function animateIris({ iris, closed, open }, arriving = false) {
    return iris.animate(
      [{ clipPath: arriving ? open : closed }, { clipPath: arriving ? closed : open }],
      { duration, easing: "cubic-bezier(0.76, 0, 0.24, 1)", fill: "forwards" },
    ).finished.catch(() => undefined);
  }

  let arriving = false;
  let origin = { x: 0.5, y: 0.5 };
  try {
    arriving = sessionStorage.getItem(storageKey) === "1";
    const saved = JSON.parse(sessionStorage.getItem(originKey) || "null");
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      origin = {
        x: Math.max(0, Math.min(1, saved.x)),
        y: Math.max(0, Math.min(1, saved.y)),
      };
    }
  } catch {
    // Use the viewport center if storage or saved coordinates are unavailable.
  }
  try {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(originKey);
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }

  if (arriving && !reduced.matches) {
    const transition = createCurtain(origin, true);
    document.documentElement.classList.add("page-transition-active");
    document.documentElement.classList.remove("page-transition-pending");
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        await animateIris(transition, true);
        transition.curtain.remove();
        document.documentElement.classList.remove("page-transition-active");
      }),
    );
  } else {
    document.documentElement.classList.remove("page-transition-pending");
  }

  addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    document.querySelector(".page-transition-curtain")?.remove();
    document.documentElement.classList.remove(
      "page-transition-active",
      "page-transition-pending",
    );
    leaving = false;
  });

  document.addEventListener("click", async (event) => {
    const link = event.target.closest("a[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      link.hasAttribute("download") ||
      link.classList.contains("project-preview") ||
      reduced.matches ||
      document.documentElement.classList.contains("motion-paused")
    )
      return;

    const destination = new URL(link.href, location.href);
    const isPage =
      destination.origin === location.origin &&
      (destination.pathname.endsWith(".html") ||
        destination.pathname.endsWith("/"));
    const isSameDocument =
      destination.pathname === location.pathname &&
      destination.search === location.search;

    if (!isPage || isSameDocument) return;

    event.preventDefault();
    if (leaving) return;
    leaving = true;
    const bounds = link.getBoundingClientRect();
    // Keyboard activation starts at the focused link rather than at (0, 0).
    const x = event.detail === 0 ? bounds.left + bounds.width / 2 : event.clientX;
    const y = event.detail === 0 ? bounds.top + bounds.height / 2 : event.clientY;
    origin = {
      x: Math.max(0, Math.min(1, x / innerWidth)),
      y: Math.max(0, Math.min(1, y / innerHeight)),
    };
    document.documentElement.classList.add("page-transition-active");
    const transition = createCurtain(origin);
    await animateIris(transition);

    try {
      sessionStorage.setItem(originKey, JSON.stringify(origin));
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // The outgoing transition still works without the arrival animation.
    }
    location.assign(destination.href);
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const language = root.lang.toLowerCase().startsWith("en") ? "en" : "hr";
  const messages = {
    hr: {
      menuOpen: "Otvori izbornik",
      menuClose: "Zatvori izbornik",
      motionPlay: "Pokreni animacije",
      motionPause: "Pauziraj animacije",
      emailCopied: "E-mail adresa je kopirana.",
      emailSelected:
        "Adresa je označena. Kopirajte je pomoću Ctrl+C ili opcije Kopiraj.",
      urlInvalid: "Unesite adresu koja počinje s https:// ili http://.",
      emailInvalid: "Unesite valjanu e-mail adresu.",
      required: "Ispunite ovo polje.",
      serverFieldInvalid: "Provjerite ovo polje.",
      sendingButton: "Slanje upita…",
      sendingStatus: "Šaljemo vaš upit…",
      sendFailed:
        "Upit nije poslan. Pokušajte ponovno ili nam se javite izravno.",
      sent: "Vaš je upit poslan. Hvala što ste nam se javili.",
      successTitle: "Upit je uspješno poslan!",
      successBody:
        "Hvala što ste nam se javili. Odgovorit ćemo vam u najkraćem mogućem roku.",
      successClose: "U redu",
      timeout:
        "Nismo mogli potvrditi slanje. Provjerite prije ponovnog pokušaja ili nam se javite izravno.",
      submit: 'Pošalji Upit <span aria-hidden="true"><svg class="icon-arrow" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></span>',
    },
    en: {
      menuOpen: "Open menu",
      menuClose: "Close menu",
      motionPlay: "Play animations",
      motionPause: "Pause animations",
      emailCopied: "Email address copied.",
      emailSelected:
        "The address is selected. Copy it with Ctrl+C or the Copy command.",
      urlInvalid: "Enter an address beginning with https:// or http://.",
      emailInvalid: "Enter a valid email address.",
      required: "Complete this field.",
      serverFieldInvalid: "Check this field.",
      sendingButton: "Sending enquiry…",
      sendingStatus: "We are sending your enquiry…",
      sendFailed:
        "Your enquiry could not be sent. Please try again or contact us directly.",
      sent: "Your enquiry has been sent. Thank you for getting in touch.",
      successTitle: "Enquiry sent successfully!",
      successBody:
        "Thank you for getting in touch. We will reply as soon as possible.",
      successClose: "Done",
      timeout:
        "We could not confirm delivery. Check before trying again or contact us directly.",
      submit: 'Send Enquiry <span aria-hidden="true"><svg class="icon-arrow" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></span>',
    },
  }[language];
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
      menuButton.setAttribute("aria-label", messages.menuOpen);
      if (focus) menuButton.focus();
    };
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      navigation.classList.toggle("active", open);
      menuButton.classList.toggle("active", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute(
        "aria-label",
        open ? messages.menuClose : messages.menuOpen,
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

  document.querySelectorAll("[data-language]").forEach((link) => {
    link.addEventListener("click", () => {
      try {
        localStorage.setItem("timdsgn:language", link.dataset.language);
      } catch {
        // Navigation still works when storage is unavailable.
      }
    });
  });

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
  if (!document.querySelector('.portfolio-showcase')) motionHost?.append(motionButton);
  let paused = false;
  const tweens = [];
  function updateMotion() {
    root.classList.toggle("no-motion", reduced.matches);
    root.classList.toggle("motion-enabled", !reduced.matches);
    root.classList.toggle("motion-paused", paused || reduced.matches);
    motionButton.hidden = reduced.matches;
    motionButton.innerHTML = paused
      ? `<span aria-hidden="true">▶</span><span class="sr-only">${messages.motionPlay}</span>`
      : `<span aria-hidden="true">⏸</span><span class="sr-only">${messages.motionPause}</span>`;
    motionButton.setAttribute(
      "aria-label",
      paused ? messages.motionPlay : messages.motionPause,
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

  const lightbox = document.querySelector(".portfolio-lightbox");
  const previews = [...document.querySelectorAll(".project-preview")];
  if (lightbox && typeof lightbox.showModal === "function") {
    const image = lightbox.querySelector(".lightbox-image");
    const title = lightbox.querySelector("#lightbox-title");
    const caption = lightbox.querySelector("#lightbox-caption");
    const counter = lightbox.querySelector(".lightbox-counter");
    let active = 0;
    let opener = null;
    function showPreview(index) {
      active = (index + previews.length) % previews.length;
      const preview = previews[active];
      image.src = preview.href;
      image.alt = preview.querySelector("img").alt;
      title.textContent = preview.dataset.project;
      caption.textContent = preview.dataset.caption;
      counter.textContent = `${active + 1} / ${previews.length}`;
    }
    previews.forEach((preview, index) => {
      preview.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        opener = preview;
        showPreview(index);
        lightbox.showModal();
        root.classList.add("lightbox-open");
      });
    });
    lightbox
      .querySelector(".lightbox-close")
      .addEventListener("click", () => lightbox.close());
    lightbox
      .querySelector(".lightbox-previous")
      .addEventListener("click", () => showPreview(active - 1));
    lightbox
      .querySelector(".lightbox-next")
      .addEventListener("click", () => showPreview(active + 1));
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        showPreview(active + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    lightbox.addEventListener("click", (event) => {
      if (event.target !== lightbox) return;
      const bounds = lightbox.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        lightbox.close();
    });
    lightbox.addEventListener("close", () => {
      root.classList.remove("lightbox-open");
      opener?.focus({ preventScroll: true });
    });
  }

  const copyEmail = document.querySelector(".copy-email");
  if (copyEmail) {
    copyEmail.hidden = false;
    copyEmail.addEventListener("click", async () => {
      const status = document.querySelector(".copy-status");
      try {
        await navigator.clipboard.writeText("studio@timdsgn.com");
        status.textContent = messages.emailCopied;
      } catch {
        const range = document.createRange();
        range.selectNodeContents(document.querySelector(".contact-email"));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = messages.emailSelected;
      }
    });
  }

  const form = document.querySelector(".contact-form");
  if (!form) return;
  const service = form.elements.service;
  const groups = [...form.querySelectorAll(".service-brief")];
  const status = form.querySelector(".form-status");
  const fallback = form.querySelector(".form-fallback");
  const submit = form.querySelector('[type="submit"]');
  let sending = false;

  function burstConfetti(dialog) {
    if (reduced.matches) return;

    const canvas = document.createElement("canvas");
    canvas.className = "success-confetti";
    canvas.setAttribute("aria-hidden", "true");
    dialog.appendChild(canvas);

    const context = canvas.getContext("2d");
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    context.scale(ratio, ratio);

    const dialogRect = dialog.getBoundingClientRect();
    const origin = {
      x: dialogRect.left + dialogRect.width / 2,
      y: dialogRect.top + Math.min(dialogRect.height * 0.38, 150),
    };
    const colors = ["#ffffff", "#b6ff47", "#ff4f9a", "#61a8ff", "#ffd84a"];
    const particles = Array.from({ length: 42 }, (_, index) => {
      const angle = (-160 + Math.random() * 140) * (Math.PI / 180);
      const speed = 8 + Math.random() * 9;
      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.18 + Math.random() * 0.08,
        drag: 0.985 + Math.random() * 0.008,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.35,
        width: 5 + Math.random() * 6,
        height: 3 + Math.random() * 5,
        color: colors[index % colors.length],
        circle: index % 5 === 0,
      };
    });

    const started = performance.now();
    let previous = started;
    function draw(now) {
      const elapsed = now - started;
      const frame = Math.min((now - previous) / 16.67, 2);
      previous = now;
      context.clearRect(0, 0, innerWidth, innerHeight);
      context.globalAlpha = Math.max(0, Math.min(1, (1650 - elapsed) / 450));

      particles.forEach((particle) => {
        particle.vx *= particle.drag ** frame;
        particle.vy = particle.vy * particle.drag ** frame + particle.gravity * frame;
        particle.x += particle.vx * frame;
        particle.y += particle.vy * frame;
        particle.rotation += particle.rotationSpeed * frame;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        if (particle.circle) {
          context.beginPath();
          context.arc(0, 0, particle.width / 2, 0, Math.PI * 2);
          context.fill();
        } else {
          context.fillRect(
            -particle.width / 2,
            -particle.height / 2,
            particle.width,
            particle.height,
          );
        }
        context.restore();
      });

      if (elapsed < 1650) requestAnimationFrame(draw);
      else canvas.remove();
    }
    requestAnimationFrame(draw);
  }

  function showSuccess() {
    let dialog = document.querySelector(".success-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "success-dialog";
      dialog.setAttribute("aria-labelledby", "success-dialog-title");
      dialog.setAttribute("aria-describedby", "success-dialog-message");
      dialog.innerHTML = `
        <div class="success-card">
          <div class="success-check" aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="29"></circle>
              <path d="m19 33 9 9 18-21"></path>
            </svg>
          </div>
          <p class="success-eyebrow">TIMDSGN</p>
          <h2 id="success-dialog-title">${messages.successTitle}</h2>
          <p id="success-dialog-message">${messages.successBody}</p>
          <button class="btn btn-pill-filled no-magnetic success-close" type="button">${messages.successClose}</button>
        </div>`;
      document.body.appendChild(dialog);
      dialog.querySelector(".success-close").addEventListener("click", () =>
        dialog.close(),
      );
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    }

    dialog.showModal();
    setTimeout(() => burstConfetti(dialog), 120);
  }

  const params = new URLSearchParams(location.search);
  const preselection = params.get("service") || params.get("usluga");
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
              ? messages.urlInvalid
              : messages.emailInvalid
            : messages.required,
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
    submit.textContent = messages.sendingButton;
    status.textContent = messages.sendingStatus;
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
            if (field)
              fieldError(
                field,
                language === "en" ? messages.serverFieldInvalid : message,
              );
          }
        throw new Error(
          (language === "hr" && result?.message) ||
            messages.sendFailed,
        );
      }
      form.reset();
      status.textContent = messages.sent;
      showSuccess();
    } catch (error) {
      status.textContent =
        error.name === "AbortError"
          ? messages.timeout
          : language === "hr" && error.message !== "Failed to fetch"
            ? error.message
            : messages.sendFailed;
      fallback.hidden = false;
    } finally {
      clearTimeout(timeout);
      sending = false;
      enabledControls.forEach((el) => {
        el.disabled = false;
      });
      submit.disabled = false;
      submit.innerHTML = messages.submit;
      form.removeAttribute("aria-busy");
      updateService();
      status.focus();
    }
  });
});
// Keep the decorative footer still when reduced motion is requested.
document.addEventListener("DOMContentLoaded", () => {
  const video = document.querySelector(".footer-video");
  if (!video) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = false;
  const syncPlayback = () => {
    if (reducedMotion.matches || !inView || document.hidden) {
      video.pause();
      if (reducedMotion.matches) video.currentTime = 0;
    } else {
      video.play().catch(() => {});
    }
  };
  video.muted = true;
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncPlayback();
  }).observe(video);
  reducedMotion.addEventListener("change", syncPlayback);
  document.addEventListener("visibilitychange", syncPlayback);
  syncPlayback();
});
