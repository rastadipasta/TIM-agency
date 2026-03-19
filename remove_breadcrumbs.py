import os, re
files = ['usluga-web-dizajn.html', 'usluga-graficki-dizajn.html', 'usluga-digitalni-proizvodi.html']
for filename in files:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = re.compile(r'\s*<div class="breadcrumb">.*?</div>', re.DOTALL)
    new_content = pattern.sub('', content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
print("Breadcrumbs removed.")
