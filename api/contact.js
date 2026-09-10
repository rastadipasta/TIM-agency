const RECIPIENT = process.env.CONTACT_TO_EMAIL || "studio@timdsgn.com";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_BODY_BYTES = 24 * 1024;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const RATE_LIMIT_MAX_CLIENTS = 5000;
const RATE_LIMIT_STORE = Symbol.for("timdsgn.contact-rate-limits");

const rateLimits = globalThis[RATE_LIMIT_STORE] || new Map();
globalThis[RATE_LIMIT_STORE] = rateLimits;

const FIELD_LABELS = {
  name: "Ime i prezime",
  email: "E-mail",
  service: "Usluga",
  message: "Ideja za projekt",
  company: "Tvrtka",
  phone: "Telefon",
  website: "Postojeći web",
  deadline: "Željeni rok",
  budget: "Okvirni budžet",
  webType: "Nova stranica ili redizajn",
  features: "Potrebne funkcionalnosti",
  contentReady: "Tekstovi i fotografije",
  materials: "Potrebni materijali",
  identity: "Postojeći vizualni identitet",
  references: "Poveznice na reference",
  platform: "Platforma",
  stage: "Faza projekta",
  tasks: "Ključni korisnički zadaci",
};

const LIMITS = {
  name: 120,
  email: 254,
  service: 30,
  message: 5000,
  company: 160,
  phone: 40,
  website: 500,
  deadline: 160,
  budget: 120,
  webType: 1000,
  features: 1000,
  contentReady: 1000,
  materials: 1000,
  identity: 1000,
  references: 1000,
  platform: 1000,
  stage: 1000,
  tasks: 1000,
};

const SERVICES = {
  web: "Web dizajn",
  graphic: "Grafički dizajn",
  digital: "Digitalni proizvodi",
  general: "Opći upit / nije odabrano",
};

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function header(request, name) {
  const headers = request.headers;
  const value =
    typeof headers?.get === "function"
      ? headers.get(name)
      : headers?.[name.toLowerCase()];
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first.split(",")[0].trim() : "";
}

function isSameOrigin(request) {
  const host = header(request, "x-forwarded-host") || header(request, "host");
  const source = header(request, "origin") || header(request, "referer");
  const protocol = header(request, "x-forwarded-proto") || "https";
  if (!host || !source) return false;

  try {
    const sourceUrl = new URL(source);
    return (
      sourceUrl.host.toLowerCase() === host.toLowerCase() &&
      sourceUrl.protocol === `${protocol.toLowerCase()}:`
    );
  } catch {
    return false;
  }
}

function clientIp(request) {
  return (
    header(request, "x-vercel-forwarded-for") ||
    header(request, "x-forwarded-for") ||
    header(request, "x-real-ip") ||
    request.socket?.remoteAddress ||
    "unknown"
  );
}

function consumeRateLimit(request) {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const ip = clientIp(request);
  const attempts = (rateLimits.get(ip) || []).filter((time) => time > cutoff);

  if (attempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    return Math.max(1, Math.ceil((attempts[0] + RATE_LIMIT_WINDOW_MS - now) / 1000));
  }

  attempts.push(now);
  rateLimits.set(ip, attempts);

  if (rateLimits.size > RATE_LIMIT_MAX_CLIENTS) {
    for (const [key, times] of rateLimits) {
      if (!times.some((time) => time > cutoff)) rateLimits.delete(key);
    }
    while (rateLimits.size > RATE_LIMIT_MAX_CLIENTS) {
      rateLimits.delete(rateLimits.keys().next().value);
    }
  }

  return 0;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validate(body) {
  const errors = {};
  const cleaned = {};

  for (const [field, limit] of Object.entries(LIMITS)) {
    cleaned[field] = text(body[field]);
    if (cleaned[field].length > limit) errors[field] = "Unos je predugačak.";
  }

  for (const field of ["name", "email", "service", "message"]) {
    if (!cleaned[field]) errors[field] = "Ispunite ovo polje.";
  }

  if (
    cleaned.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)
  ) {
    errors.email = "Unesite valjanu e-mail adresu.";
  }

  if (cleaned.service && !Object.hasOwn(SERVICES, cleaned.service)) {
    errors.service = "Odaberite valjanu uslugu.";
  }

  if (cleaned.website && !/^https?:\/\//i.test(cleaned.website)) {
    errors.website = "Unesite adresu koja počinje s https:// ili http://.";
  }

  return { cleaned, errors };
}

function makeEmail(data) {
  const rows = Object.entries(FIELD_LABELS)
    .filter(([field]) => data[field])
    .map(([field, label]) => {
      const value = field === "service" ? SERVICES[data[field]] : data[field];
      return { label, value };
    });

  const htmlRows = rows
    .map(
      ({ label, value }) =>
        `<tr><th style="padding:8px 16px 8px 0;text-align:left;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    subject: `Novi upit: ${SERVICES[data.service]} — ${data.name.replace(/[\r\n]+/g, " ")}`,
    html: `<h1>Novi upit s timdsgn.com</h1><table style="border-collapse:collapse">${htmlRows}</table>`,
    text: ["Novi upit s timdsgn.com", "", ...rows.map(({ label, value }) => `${label}: ${value}`)].join("\n"),
  };
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, message: "Method not allowed." });
  }

  if (!isSameOrigin(request)) {
    return response.status(403).json({ ok: false, message: "Forbidden." });
  }

  const contentType = header(request, "content-type")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (
    contentType !== "application/json" &&
    contentType !== "application/x-www-form-urlencoded"
  ) {
    return response.status(415).json({
      ok: false,
      message: "Unsupported media type.",
    });
  }

  const body =
    request.body && typeof request.body === "object" && !Array.isArray(request.body)
      ? request.body
      : {};
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) {
    return response.status(413).json({ ok: false, message: "Request too large." });
  }

  const retryAfter = consumeRateLimit(request);
  if (retryAfter) {
    response.setHeader("Retry-After", String(retryAfter));
    return response.status(429).json({
      ok: false,
      message: "Previše pokušaja. Pričekajte prije ponovnog slanja.",
    });
  }

  // Bots commonly fill hidden fields. Return success without sending mail so they do not retry.
  if (text(body.fax)) return response.status(200).json({ ok: true });

  const { cleaned, errors } = validate(body);
  if (Object.keys(errors).length) {
    return response.status(422).json({
      ok: false,
      message: "Provjerite označena polja.",
      errors,
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error("Contact form is missing RESEND_API_KEY or CONTACT_FROM_EMAIL.");
    return response.status(503).json({
      ok: false,
      message: "Slanje trenutačno nije dostupno. Javite nam se izravno e-mailom.",
    });
  }

  const email = makeEmail(cleaned);

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [RECIPIENT],
        reply_to: cleaned.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    const result = await resendResponse.json().catch(() => null);
    if (!resendResponse.ok) {
      console.error("Resend rejected contact email:", resendResponse.status, result);
      return response.status(502).json({
        ok: false,
        message: "Upit nije poslan. Pokušajte ponovno ili nam se javite izravno.",
      });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact email request failed:", error);
    return response.status(502).json({
      ok: false,
      message: "Upit nije poslan. Pokušajte ponovno ili nam se javite izravno.",
    });
  }
};
