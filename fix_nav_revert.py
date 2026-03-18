import os
import re

for fname in os.listdir('.'):
    if not fname.endswith('.html'): continue
    with open(fname, 'r', encoding='utf-8') as f:
        data = f.read()
    
    # Remove the freshly added bare nav-cta link
    data = re.sub(r'<a href=\"kontakt\.html\" class=\"btn btn-primary nav-cta\">Kontakt</a>\s*<div class=\"mobile-menu-btn\">', r'<div class=\"mobile-menu-btn\">', data)
    
    # Re-insert the li inside the ul
    li_html = '<li><a href=\"kontakt.html\" class=\"btn btn-primary nav-cta\">Kontakt</a></li>'
    if 'Kontakt</a></li>' not in data:
        data = re.sub(r'(<li><a href=\"proces\.html\".*?</li>\s*)(</ul>)', r'\1    ' + li_html + r'\n            \2', data)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(data)
