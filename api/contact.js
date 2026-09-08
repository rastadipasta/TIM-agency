const RECIPIENT = process.env.CONTACT_TO_EMAIL || "studio@timdsgn.com";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

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
    subject: `Novi upit: ${SERVICES[data.service]} — ${data.name}`,
    html: `<h1>Novi upit s timdsgn.com</h1><table style="border-collapse:collapse">${htmlRows}</table>`,
    text: ["Novi upit s timdsgn.com", "", ...rows.map(({ label, value }) => `${label}: ${value}`)].join("\n"),
  };
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const body = request.body && typeof request.body === "object" ? request.body : {};

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
