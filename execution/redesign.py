"""Build shared, localized editorial regions into the existing static routes.

Run from the repository root: python execution/redesign.py
Requires beautifulsoup4 and Pillow. Existing page content and URLs are retained.
"""
import json
from pathlib import Path
from html import escape
from bs4 import BeautifulSoup
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CONTENT = json.loads((ROOT / 'content/design.json').read_text(encoding='utf-8'))
ROUTES = {
    'hr': ['index.html', 'usluga-web-dizajn.html', 'usluga-graficki-dizajn.html', 'usluga-digitalni-proizvodi.html', 'galerija.html', 'kontakt.html'],
    'en': ['en/index.html', 'en/web-design.html', 'en/graphic-design.html', 'en/digital-products.html', 'en/portfolio.html', 'en/contact.html'],
}
KEYS = ['home', 'web', 'graphic', 'digital', 'portfolio', 'contact']

def fragment(html):
    return BeautifulSoup(html, 'html.parser').find()

def href(lang, index):
    return ('../' if lang == 'en' else '') + ROUTES[lang][index]

def header(lang, index):
    c = CONTENT[lang]
    links = ''.join(f'<li><a class="nav-link" href="{href(lang,i)}" {"aria-current=page" if i == index else ""}>{escape(c["nav"][i-1])}</a></li>' for i in range(1,6))
    langs = ''.join(f'<a class="language-link" data-language="{l}" href="{("../" if lang == "en" else "") + ROUTES[l][index]}" lang="{l}" {"aria-current=true" if lang == l else ""}>{l.upper()}</a>' + ('<span aria-hidden="true">/</span>' if l == 'hr' else '') for l in ['hr','en'])
    return f'<nav class="navbar editorial-nav" aria-label="{c["navigation"]}"><div class="nav-container"><a class="nav-logo" href="{href(lang,0)}" aria-label="TIMDSGN — {c["homeLabel"]}">TIMDSGN<sup>®</sup></a><ul class="nav-links" id="navigation">{links}</ul><div class="nav-right"><div class="language-selector" aria-label="{c["language"]}">{langs}</div><button class="mobile-menu-btn" type="button" aria-controls="navigation" aria-expanded="false" aria-label="{c["menu"]}"><span class="line line1"></span><span class="line line2"></span><span class="line line3"></span></button></div></div></nav>'

def hero(lang, key):
    c = CONTENT[lang]; h = c[key]; prefix = '../' if lang == 'en' else ''
    stages = ''.join(f'<{"a" if key == "home" else "div"} class="hero-stage" {"href=" + chr(34) + href(lang,i+1) + chr(34) if key == "home" else ""}><span class="stage-number">0{i+1}</span><span class="stage-title">{s[0]}</span><span class="micro">{s[1]}</span></{"a" if key == "home" else "div"}>' for i,s in enumerate(h['stages']))
    title = '<br>'.join(f'<span>{line}</span>' for line in h['title'])
    return f'''<header class="editorial-hero hero-{key}">
      <div class="hero-copy"><p class="eyebrow">{h['label']}</p><h1>{title}</h1><p class="hero-description">{h['description']}</p>
      <div class="hero-actions"><a class="editorial-button" href="{href(lang,5)}">{h['cta']}<span aria-hidden="true">⟶</span></a><a class="text-link" href="{href(lang,4) if key == 'home' else '#process'}">{h['secondary']}</a></div><div class="hero-stages">{stages}</div></div>
      <div class="hero-art" aria-hidden="true"><div class="background-words">{''.join('<span>'+w+'</span>' for w in h['words'])}</div><img class="hero-artwork" src="{prefix}resources/Editorial/{key}.webp" srcset="{prefix}resources/Editorial/{key}-small.webp 480w, {prefix}resources/Editorial/{key}.webp 920w" sizes="(max-width: 900px) 94vw, 54vw" width="920" height="920" alt="" fetchpriority="high"><span class="art-note micro">{c['artNote']}</span><span class="art-signature micro">{c['signature']}</span></div>
    </header>'''

def footer(lang):
    c = CONTENT[lang]
    return f'<footer class="editorial-footer"><div class="footer-top"><a class="footer-wordmark" href="{href(lang,0)}">TIMDSGN<sup>®</sup></a><p>{c["footerLine"]}</p><a class="text-link" href="mailto:studio@timdsgn.com">studio@timdsgn.com ↗</a></div><div class="footer-bottom"><span>© 2026 TIMDSGN. {c["rights"]}</span><span>{c["location"]}</span><a href="#sadrzaj">{c["top"]} ↑</a></div></footer>'

def art():
    out = ROOT / 'resources/Editorial'; out.mkdir(exist_ok=True)
    # Only the visual composition is used; all navigation, headings and CTAs are HTML.
    crops = {
      'home': ('homepage', (840,195,1460,865), [(929,250),(1220,203),(1220,300),(1336,322),(1336,400),(1446,412),(1446,765),(1350,739),(1364,816),(1335,843),(1100,851),(993,839),(893,817),(921,716),(948,671),(929,679),(929,596),(857,617),(857,378),(929,360)]),
      'web': ('web-design', (715,135,1510,887), [(923,155),(929,146),(1168,202),(1170,257),(1406,305),(1407,421),(1435,426),(1435,492),(1498,506),(1498,706),(1409,695),(1409,796),(1344,785),(1366,837),(1254,867),(975,861),(853,827),(879,762),(855,755),(850,658),(723,658),(723,443),(804,450),(805,209),(814,199),(923,219)]),
      'graphic': ('graphic-design', (773,187,1474,868), [(863,208),(1143,193),(1143,305),(1248,325),(1248,394),(1263,390),(1382,408),(1382,610),(1465,617),(1465,793),(1335,766),(1339,823),(1260,852),(1069,846),(863,813),(876,776),(788,759),(817,592),(781,594),(781,303),(862,288)]),
      'digital': ('digital-products', (778,239,1616,887), [(896,257),(905,245),(1441,331),(1448,340),(1448,373),(1567,345),(1567,466),(1609,474),(1609,663),(1550,651),(1550,784),(1428,754),(1428,804),(1338,790),(1365,845),(1260,873),(973,864),(832,827),(850,770),(803,775),(786,763),(785,433),(795,422),(836,414),(837,334),(894,325)])
    }
    for key, (name, box, outline) in crops.items():
        source = Image.open(ROOT / f'resources/Redesign - reference/{name}-reference.png').convert('RGBA')
        mask = Image.new('L', source.size, 0)
        ImageDraw.Draw(mask).polygon(outline, fill=255)
        source.putalpha(mask.filter(ImageFilter.GaussianBlur(.5)))
        source = source.crop(box)
        source.thumbnail((920,900), Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(920,920),(0,0,0,0))
        canvas.alpha_composite(source,((920-source.width)//2,(920-source.height)//2))
        canvas.save(out / f'{key}.webp',quality=88)
        canvas.resize((480,480),Image.Resampling.LANCZOS).save(out / f'{key}-small.webp',quality=83)

def portfolio_images():
    for path in (ROOT/'resources/Portfolio').glob('*.png'):
        if not path.name.startswith(('anna-', 'antena-', 'calma-')):
            continue
        image = Image.open(path).convert('RGB')
        for width in (800,1600):
            resized = image.resize((width,round(width*image.height/image.width)),Image.Resampling.LANCZOS)
            resized.save(ROOT/f'resources/Editorial/{path.stem}-{width}.webp',quality=88)

def build():
    for lang,routes in ROUTES.items():
        c=CONTENT[lang]
        for index,route in enumerate(routes):
            path=ROOT/route; soup=BeautifulSoup(path.read_text(encoding='utf-8'),'html.parser'); key=KEYS[index]
            soup.body['class']=list(dict.fromkeys(soup.body.get('class',[])+['editorial-site']))
            soup.select_one('.navbar').replace_with(fragment(header(lang,index)))
            if not soup.select_one('link[href*="editorial.css"]'):
                soup.head.append(fragment(f'<link rel="stylesheet" href="{"../" if lang == "en" else ""}editorial.css?v=20260910-fit">'))
            old=soup.select_one('.editorial-hero, .hero, .subpage-hero')
            if index<4:
                old.replace_with(fragment(hero(lang,key)))
            elif key=='contact':
                old.replace_with(fragment(f'<header class="subpage-hero editorial-contact"><p class="eyebrow">{c["nav"][4]}</p><h1>{c["contactTitle"]}</h1><p class="hero-description">{c["contactIntro"]}</p></header>'))
            if index in [1,2,3]:
                process=soup.select_one('.subpage-2col'); process['id']='process'
                if not process.select_one('.process-heading'):
                    process.insert(0,fragment(f'<div class="process-heading"><p class="eyebrow">{c["processLabel"]}</p><h2>{c["processTitle"]}</h2></div>'))
                for heading in process.select('.process-step h2'):
                    heading.name='h3'
                if not soup.select_one('.service-work'):
                    if key=='web':
                        image='anna-edition-dark.png'; dest=href(lang,4)+'#anna-edition'; label='Anna Édition'; caption=c['workLabel']
                    else:
                        image='premium_brand_identity.png' if key=='graphic' else 'premium_iphone_ui.png'; dest=href(lang,5); label=c[key]['stages'][1][0]; caption=c['visualLabel']
                    prefix='../' if lang=='en' else ''
                    process.insert_after(fragment(f'<section class="service-work"><div class="section-header"><h2>{caption}</h2><a class="text-link" href="{dest}">{c["discover"]} ↗</a></div><a href="{dest}"><img src="{prefix}resources/Portfolio/{image}" loading="lazy" decoding="async" alt="{label}"></a></section>'))
            for el in soup.select('.theme-trigger'):
                el['class']=[v for v in el['class'] if v!='theme-trigger']
            sep=soup.select_one('.geometric-separator')
            if sep: sep.decompose()
            soup.select_one('footer').replace_with(fragment(footer(lang)))
            for image in soup.select('img[src]'):
                original_path = path.parent / image['src']
                if ('width' not in image or 'height' not in image) and original_path.exists():
                    with Image.open(original_path) as asset:
                        image['width'],image['height']=str(asset.width),str(asset.height)
                stem=Path(image['src']).stem.removesuffix('-1600').removesuffix('-800')
                if stem.startswith(('anna-', 'antena-', 'calma-')):
                    prefix='../' if lang=='en' else ''
                    image['src']=f'{prefix}resources/Editorial/{stem}-1600.webp'
                    image['srcset']=f'{prefix}resources/Editorial/{stem}-800.webp 800w, {prefix}resources/Editorial/{stem}-1600.webp 1600w'
                    image['sizes']='(max-width: 600px) 90vw, 48vw' if index in (0,4) else '91vw'
            # Remove the language auto-redirect so explicit HR URLs stay in HR.
            for script in soup.select('head script:not([src])'):
                if 'browserLanguage' in script.get_text(): script.decompose()
            path.write_text(str(soup),encoding='utf-8')

if __name__=='__main__':
    art()
    portfolio_images()
    build()
