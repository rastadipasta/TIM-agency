# TIMDSGN — production website

English-only HTML/CSS/JavaScript website based on Figma Code layer 316:3. Homepage typography is static; mosaic interactions, images, decorative motion and the Services book retain their animations.

Run `npm test`, then `npm run build`. Serve `public/` for the static preview. The `api/contact.js` function runs on Vercel; it is never copied into the public directory. No external JavaScript dependencies are required.

Production pages: `/`, `/contact.html`, `/brief.html`, `/privacy.html`, `/terms.html`, `/cookies.html`. `vercel.json` redirects old HR and `/en/` URLs to the new canonical destinations.

`services.mjs` defines nine service slugs and their optional questions. Contact accepts a `service` slug and optional `serviceDetails` (up to 4000 characters). Brief sends `service: "brief"`, `briefServices` and `projectBrief` (up to 16000 characters). Legacy service keys remain supported. The existing Vercel email environment settings are retained; never put them in public files.

On timdsgn.com, Contact and Brief use the existing API. Local and preview hosts prepare an email draft and TXT download. Only an API success with `{ "ok": true }` confirms receipt. Personal answers stay in memory. Cookie consent uses the existing version-two consent record; Analytics loads only with permission on the production hostname.

The public build is a strict allowlist (`scripts/public-files.json`) plus local `assets/` and `fonts/`. Archives, tests, source scripts, old pages and secrets are excluded from the served directory. Backup and release reports live in `outputs/`, outside production.
