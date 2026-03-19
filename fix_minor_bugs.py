import os

html_files = ['index.html', 'usluga-web-dizajn.html', 'usluga-graficki-dizajn.html', 'usluga-digitalni-proizvodi.html', 'galerija.html', 'kontakt.html']

for html_file in html_files:
    if os.path.exists(html_file):
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Add viewport-fit=cover to remove white bars on mobile landscape (safe areas)
        content = content.replace('initial-scale=1.0">', 'initial-scale=1.0, viewport-fit=cover">')
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(content)

with open('style.css', 'a', encoding='utf-8') as f:
    f.write("\n")
    f.write("/* FIXES FOR MOBILE LANDSCAPE AND Z-INDEX */\n")
    f.write("html, body {\n")
    f.write("    background-color: var(--bg-primary) !important;\n")
    f.write("    overflow-x: hidden;\n")
    f.write("    width: 100vw;\n")
    f.write("}\n")
    f.write("#hero-canvas {\n")
    f.write("    position: absolute;\n")
    f.write("    top: 0;\n")
    f.write("    left: 0;\n")
    f.write("    z-index: 0 !important;\n")
    f.write("    width: 100%;\n")
    f.write("    height: 100%;\n")
    f.write("    pointer-events: none;\n") # Let clicks pass through to background if needed
    f.write("}\n")
    f.write(".hero-logo-wrapper, .hero-content, .subpage-hero .breadcrumb, .subpage-hero h1, .subpage-hero p {\n")
    f.write("    position: relative;\n")
    f.write("    z-index: 10 !important;\n")
    f.write("}\n")
    
print("Fixed viewport metadata and z-index layers.")
