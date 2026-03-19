import re

with open('canvas-particles.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_resize = """    window.addEventListener("resize", () => {
        resizeCanvas();
        initParticles();
    });"""

new_resize = """    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
        // Only recreate particles if the width changes (orientation change)
        // This prevents the animation from jumping when scrolling on mobile (address bar collapse)
        if (window.innerWidth !== lastWidth) {
            lastWidth = window.innerWidth;
            resizeCanvas();
            initParticles();
        }
    });"""

js = js.replace(old_resize, new_resize)
with open('canvas-particles.js', 'w', encoding='utf-8') as f:
    f.write(js)

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

old_media = """@media screen and (max-width: 950px) and (orientation: landscape) {
  .hero {
    min-height: 100vh;
    padding-top: 80px;
    padding-bottom: 40px;
    display: flex;
    align-items: center;
  }
  .hero-content {
    margin-top: 0;
  }
  .subpage-hero {
    padding-top: 100px;
    padding-bottom: 40px;
  }
  .features-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .process-mini {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}"""

new_media = """@media screen and (max-width: 950px) and (orientation: landscape) {
  .hero {
    min-height: auto !important;
    height: auto !important;
    padding-top: 120px;
    padding-bottom: 60px;
    display: block !important;
  }
  .hero-content {
    margin-top: 0;
  }
  .subpage-hero {
    padding-top: 100px;
    padding-bottom: 40px;
  }
  .features-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .process-mini {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}"""

if old_media in css:
    css = css.replace(old_media, new_media)
else:
    print("Old CSS block not found, appending new landscape block.")
    css += '\n' + new_media

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('JS and CSS updated.')
