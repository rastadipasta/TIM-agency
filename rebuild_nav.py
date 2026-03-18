import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for fname in html_files:
    with open(fname, 'r', encoding='utf-8') as f:
        data = f.read()
    
    # 1. Remove existing Kontakt links
    data = re.sub(r'<li>\s*<a href=\"kontakt\.html\".*?</a>\s*</li>', '', data)
    data = re.sub(r'<a href=\"kontakt\.html\"[^>]*nav-cta[^>]*>Kontakt</a>', '', data)
    
    # 2. Add mobile-only link inside nav-links
    if 'class=\"mobile-only-link\"' not in data:
        data = re.sub(r'(</ul>)', r'    <li class=\"mobile-only-link\"><a href=\"kontakt.html\" class=\"nav-link\">Kontakt</a></li>\n            \1', data)
    
    # 3. Add nav-right wrapper around mobile-menu-btn
    if '<div class=\"nav-right\">' not in data:
        replacement = """<div class=\"nav-right\">
                <a href=\"kontakt.html\" class=\"btn btn-primary nav-cta\">Kontakt</a>
                <div class=\"mobile-menu-btn\">
                    <i data-feather=\"menu\"></i>
                </div>
            </div>"""
        data = re.sub(r'<div class=\"mobile-menu-btn\">\s*<i data-feather=\"menu\"></i>\s*</div>', replacement, data)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(data)
