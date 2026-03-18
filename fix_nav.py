import os
import re

for fname in os.listdir('.'):
    if not fname.endswith('.html'): continue
    with open(fname, 'r', encoding='utf-8') as f:
        data = f.read()
    
    # Remove inner li containing nav-cta
    data = re.sub(r'<li>\s*<a href=\"kontakt\.html\"[^>]*nav-cta[^>]*>.*?</a>\s*</li>', '', data)
    # Remove raw nav-cta just in case
    data = re.sub(r'<a href=\"kontakt\.html\"[^>]*nav-cta[^>]*>.*?</a>', '', data)
    
    # Insert raw newly
    btn_html = '<a href=\"kontakt.html\" class=\"btn btn-primary nav-cta\">Kontakt</a>'
    data = re.sub(r'(</ul>)\s*(<div class=\"mobile-menu-btn\">)', r'\1\n            ' + btn_html + r'\n            \2', data)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(data)
