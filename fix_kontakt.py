import os, re

# Only fix subpages (not index.html, not kontakt.html)
files = ['usluga-web-dizajn.html', 'usluga-graficki-dizajn.html', 'usluga-digitalni-proizvodi.html']

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    for i, line in enumerate(lines):
        # Skip mobile-only-link lines that are INSIDE check-list (not inside nav-links)
        if 'mobile-only-link' in line and 'kontakt.html' in line:
            # Check if we are inside a check-list by looking backwards
            in_checklist = False
            for j in range(i-1, max(0, i-20), -1):
                if 'check-list' in lines[j]:
                    in_checklist = True
                    break
                if 'nav-links' in lines[j]:
                    break
            if in_checklist:
                continue  # Skip this line
        new_lines.append(line)

    with open(fname, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

print("Done! Removed stray Kontakt links from check-lists.")
