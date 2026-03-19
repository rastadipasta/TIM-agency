import re

with open('canvas-particles.js', 'r', encoding='utf-8') as f:
    js = f.read()

# I will use a regex to match the comment // Logo Repulsion up to the closing brace of the if(!isMobile) statement.
pattern = re.compile(r'\s*// Logo Repulsion.*?\}\s*\}', re.DOTALL)
new_js = pattern.sub('\n', js)

with open('canvas-particles.js', 'w', encoding='utf-8') as f:
    f.write(new_js)

print("Logo repulsion removed.")
