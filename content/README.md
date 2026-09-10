# TIMDSGN editorial content

The production site remains static HTML, with its existing Croatian and English URLs.
`design.json` is the shared source for the header, language links, four hero layouts,
process headings, contact introduction and footer. Existing detailed service copy,
portfolio projects and the contact form remain in the original page files.

To regenerate these shared regions and optimized artwork from the supplied references:

```powershell
python -m pip install -r execution/requirements-design.txt
python execution/redesign.py
```

The generator is idempotent. It writes all 12 existing routes and WebP assets in
`resources/Editorial`. Original portfolio URLs and full-resolution lightbox images
are retained. Edit `editorial.css` for the shared visual system. `style.css`,
`script.js`, the intro video and `api/contact.js` retain their existing behavior.

Local visual preview:

```powershell
python -m http.server 3131 --bind 127.0.0.1
```

The Python preview serves static files; email delivery requires the existing server
runtime for `/api/contact` and its configured provider. It is not provided by this
preview command.
