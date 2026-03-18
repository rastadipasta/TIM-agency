import os, re

# SEO config per page
seo = {
    'index.html': {
        'title': 'TIM | Agencija za Web Dizajn, Graficki Dizajn i Digitalne Proizvode',
        'desc': 'TIM je premium agencija specijalizirana za UI/UX dizajn, web razvoj, vizualni identitet i digitalne proizvode. Pomazemo vizionarskim brendovima ostvariti opipljive rezultate.',
        'canonical': 'https://tim-agencija.hr/',
    },
    'usluga-web-dizajn.html': {
        'title': 'Web Dizajn i UI/UX Usluge | TIM Agencija',
        'desc': 'Profesionalne usluge web dizajna i UI/UX-a. Interaktivni prototipi, wireframing, responzivni dizajn sucelja i razvoj web stranica za vase poslovanje.',
        'canonical': 'https://tim-agencija.hr/usluga-web-dizajn.html',
    },
    'usluga-graficki-dizajn.html': {
        'title': 'Graficki Dizajn i Vizualni Identitet | TIM Agencija',
        'desc': 'Profesionalna izrada logotipa, brending materijala, posjetnica, vizuala za drustvene mreze i kompletnog vizualnog identiteta za vas brend.',
        'canonical': 'https://tim-agencija.hr/usluga-graficki-dizajn.html',
    },
    'usluga-digitalni-proizvodi.html': {
        'title': 'Dizajn Digitalnih Proizvoda i Mobilnih Aplikacija | TIM Agencija',
        'desc': 'Profesionalni dizajn digitalnih proizvoda, mobilnih aplikacija i kompleksnih sustava pretvorenih u jednostavno i ugodno korisnicko iskustvo.',
        'canonical': 'https://tim-agencija.hr/usluga-digitalni-proizvodi.html',
    },
    'kontakt.html': {
        'title': 'Kontaktirajte Nas | TIM Agencija za Digitalni Dizajn',
        'desc': 'Kontaktirajte TIM agenciju za web dizajn, graficki dizajn i digitalne proizvode. Ispunite obrazac ili nas kontaktirajte direktno za besplatnu konzultaciju.',
        'canonical': 'https://tim-agencija.hr/kontakt.html',
    },
    'galerija.html': {
        'title': 'Galerija Radova i Projekata | TIM Agencija',
        'desc': 'Pregledajte nase najnovije dizajn projekte i studije slucaja. Spoj estetike i funkcionalnosti u svakom pixelu - web dizajn, UI/UX i graficki dizajn.',
        'canonical': 'https://tim-agencija.hr/galerija.html',
    },
}

og_block = '''    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{canonical}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:image" content="https://tim-agencija.hr/resources/Logo/LOGO.png">
    <meta property="og:locale" content="hr_HR">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="https://tim-agencija.hr/resources/Logo/LOGO.png">'''

jsonld = '''
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "TIM Agencija za digitalni dizajn",
      "description": "Premium agencija specijalizirana za UI/UX dizajn, web razvoj, vizualni identitet i digitalne proizvode.",
      "url": "https://tim-agencija.hr",
      "logo": "https://tim-agencija.hr/resources/Logo/LOGO.png",
      "sameAs": [],
      "serviceType": ["Web dizajn", "Graficki dizajn", "UI/UX dizajn", "Digitalni proizvodi"],
      "areaServed": {
        "@type": "Country",
        "name": "Hrvatska"
      }
    }
    </script>'''

for fname, info in seo.items():
    if not os.path.exists(fname):
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update title
    content = re.sub(r'<title>.*?</title>', f'<title>{info["title"]}</title>', content)
    # Update meta description
    content = re.sub(
        r'<meta name="description"[^>]*>',
        f'<meta name="description" content="{info["desc"]}">',
        content
    )

    # Add OG + robots + canonical after meta description (if not already there)
    if 'og:title' not in content:
        og = og_block.format(**info)
        content = re.sub(
            r'(<meta name="description"[^>]*>)',
            r'\1\n' + og,
            content
        )
    
    # Add JSON-LD only to index.html
    if fname == 'index.html' and 'application/ld+json' not in content:
        content = content.replace('<!-- Google Fonts', jsonld + '\n\n    <!-- Google Fonts')

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

print("SEO update complete for all pages!")
