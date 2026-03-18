import os, glob

html_files = glob.glob('*.html')
favicon = '<link rel="icon" type="image/png" href="resources/Logo/LOGO.png">\n'

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if '<link rel="icon"' not in content:
        # insert before </head>
        content = content.replace('</head>', f'    {favicon}</head>')
    
        with open(f, 'w', encoding='utf-8') as out:
            out.write(content)

print("Favicon added to all HTML files.")
