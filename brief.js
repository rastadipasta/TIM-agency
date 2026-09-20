document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("project-brief");
  if (!form) return;
  const en = document.documentElement.lang === "en";
  const t = (hr, english) => (en ? english : hr);
  const services = [...form.querySelectorAll('[name="services"]')];
  const status = form.querySelector(".brief-status");
  const fallback = form.querySelector(".brief-fallback");
  const submit = form.querySelector('[type="submit"]');
  const download = form.querySelector(".brief-download");
  const serviceError = document.getElementById("services-error");
  const submitLabel = submit.innerHTML;
  let sending = false;
  form.noValidate = true;
  submit.disabled = download.disabled = false;

  function selected() {
    return services.filter((input) => input.checked);
  }
  function summary() {
    const lines = ["TIMDSGN / " + t("Projektni brief", "Project brief")];
    for (const section of form.querySelectorAll(".brief-section")) {
      const values = new Map();
      if (section.id === "usluge" && selected().length) {
        values.set(
          t("Usluge", "Services"),
          selected().map((input) => input.dataset.title),
        );
      }
      for (const input of section.querySelectorAll("[data-label]")) {
        if (
          input.matches(":disabled") ||
          (input.type === "checkbox" && !input.checked) ||
          !input.value.trim()
        )
          continue;
        const label = input.dataset.label;
        values.set(label, [...(values.get(label) || []), input.value.trim()]);
      }
      if (values.size) {
        lines.push("", section.querySelector("h2").textContent);
        values.forEach((value, label) =>
          lines.push(label + ": " + value.join(", ")),
        );
      }
    }
    return lines.join("\n");
  }
  function refresh() {
    const keys = selected().map((input) => input.value);
    form.querySelectorAll("[data-category]").forEach((group) => {
      group.hidden = !keys.includes(group.dataset.category);
      group.disabled = group.hidden;
    });
    const hasDetails = keys.some((key) =>
      ["web", "graphic", "digital"].includes(key),
    );
    const hint = document.getElementById("brief-detail-hint");
    hint.hidden = hasDetails;
    hint.textContent = keys.includes("guidance")
      ? t(
          "Opišite ideju i vizualni smjer. Zajedno ćemo preporučiti potrebne usluge.",
          "Describe your idea and visual direction. We will recommend the right services together.",
        )
      : t(
          "Odaberite usluge u prvom koraku za pitanja prilagođena vašem projektu.",
          "Select services in the first section to see the relevant project questions.",
        );
    const list = document.getElementById("brief-selected");
    list.replaceChildren();
    (selected().map((input) => input.dataset.title).length
      ? selected().map((input) => input.dataset.title)
      : [t("Još ništa nije odabrano.", "Nothing selected yet.")]
    ).forEach((label) => {
      const li = document.createElement("li");
      li.textContent = label;
      list.append(li);
    });
    document.getElementById("brief-preview").textContent = summary();
  }
  form.addEventListener("input", (event) => {
    event.target.removeAttribute("aria-invalid");
    if (event.target.name === "services") {
      serviceError.textContent = "";
      services.forEach((input) => input.removeAttribute("aria-invalid"));
    }
    refresh();
  });
  form.addEventListener("change", refresh);
  refresh();
  download.addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([summary()], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "TIMDSGN-brief.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    status.textContent = "";
    fallback.hidden = true;
    serviceError.textContent = "";
    form
      .querySelectorAll("[aria-invalid]")
      .forEach((input) => input.removeAttribute("aria-invalid"));
    if (!selected().length) {
      serviceError.textContent = t(
        "Odaberite barem jednu uslugu ili opciju „Trebam preporuku”.",
        "Choose at least one service or “I need guidance”.",
      );
      services.forEach((input) => input.setAttribute("aria-invalid", "true"));
      services[0].focus();
      return;
    }
    const invalid = [...form.elements].find(
      (input) =>
        input.willValidate &&
        (!input.validity.valid || (input.required && !input.value.trim())),
    );
    if (invalid) {
      invalid.setAttribute("aria-invalid", "true");
      status.textContent =
        t("Provjerite polje: ", "Please check: ") + invalid.dataset.label + ".";
      invalid.focus();
      invalid.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const payload = Object.fromEntries(
      [
        "name",
        "email",
        "company",
        "phone",
        "website",
        "message",
        "deadline",
        "budget",
        "fax",
      ].map((key) => [key, data[key] || ""]),
    );
    payload.service = "brief";
    payload.briefServices = selected()
      .map((input) => input.dataset.title)
      .join(", ");
    payload.projectBrief = summary();
    if (payload.projectBrief.length > 16000) {
      status.textContent = t(
        "Brief je predugačak. Skratite opise ili dulje materijale podijelite poveznicom.",
        "Your brief is too long. Shorten the descriptions or share longer materials using a link.",
      );
      status.focus();
      return;
    }
    const controls = [...form.elements].filter(
      (input) => !input.matches(":disabled"),
    );
    sending = true;
    controls.forEach((input) => (input.disabled = true));
    form.setAttribute("aria-busy", "true");
    submit.textContent = t("Šaljemo…", "Sending…");
    status.textContent = t("Vaš brief se šalje.", "Your brief is being sent.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let success = false;
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        if (result?.errors)
          Object.keys(result.errors).forEach((name) =>
            form.elements
              .namedItem(name)
              ?.setAttribute?.("aria-invalid", "true"),
          );
        throw new Error(
          response.status === 429
            ? t(
                "Previše pokušaja. Pričekajte nekoliko minuta prije ponovnog slanja.",
                "Too many attempts. Wait a few minutes before trying again.",
              )
            : t(
                "Brief nije poslan. Pokušajte ponovno ili nam ga pošaljite e-mailom.",
                "Your brief was not sent. Please try again or email it to us.",
              ),
        );
      }
      success = true;
      status.textContent = t(
        "Hvala! Vaš brief je poslan. Javit ćemo vam se s prijedlogom sljedećih koraka.",
        "Thank you! Your brief has been sent. We will get back to you with the next steps.",
      );
    } catch (error) {
      status.textContent =
        error.name === "AbortError"
          ? t(
              "Slanje traje dulje od očekivanog. Nismo mogli potvrditi primitak. Možete nam se javiti e-mailom.",
              "Sending took longer than expected. We could not confirm receipt. You can contact us by email.",
            )
          : error instanceof TypeError
            ? t(
                "Slanje nije dostupno. Pokušajte ponovno ili preuzmite brief i pošaljite ga e-mailom.",
                "Sending is unavailable. Try again or download the brief and email it to us.",
              )
            : error.message;
      fallback.hidden = false;
    } finally {
      clearTimeout(timeout);
      controls.forEach((input) => (input.disabled = false));
      sending = false;
      form.removeAttribute("aria-busy");
      submit.innerHTML = submitLabel;
      refresh();
      if (success) {
        // Keep the submitted answers available for download without accidental resubmission.
        submit.disabled = true;
        submit.textContent = t("Brief poslan", "Brief sent");
        form.addEventListener(
          "input",
          () => {
            submit.disabled = false;
            submit.innerHTML = submitLabel;
          },
          { once: true },
        );
      }
      status.focus();
    }
  });
});
