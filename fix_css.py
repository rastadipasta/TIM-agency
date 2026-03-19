import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('.service-card::before, .detail-box::before, .portfolio-item::before, .contact-container::before',
                  '.service-card::before, .detail-box::before, .portfolio-item::before, .contact-container::before, .feature-card::before')

css = css.replace('.service-card:hover::before, .detail-box:hover::before, .portfolio-item:hover::before, .contact-container:hover::before',
                  '.service-card:hover::before, .detail-box:hover::before, .portfolio-item:hover::before, .contact-container:hover::before, .feature-card:hover::before')

css = css.replace('.lift-effect:hover .service-icon {',
                  '.lift-effect:hover .service-icon, .feature-card:hover .feature-icon {')
css = css.replace('background-color: var(--accent-color);',
                  'background-color: var(--accent-color);\n    color: #000;')  # Ensure icon turns black

old_feature_hover = """.feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(243, 178, 66, 0.2);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(243, 178, 66, 0.1);
}"""

new_feature_hover = """.feature-card:hover {
  transform: translateY(-8px);
  background: rgba(20, 20, 20, 0.6);
  border-color: rgba(243, 178, 66, 0.2);
  box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px var(--accent-glow);
}"""

css = css.replace(old_feature_hover, new_feature_hover)

landscape_css = """
/* =======================================
   MOBILE LANDSCAPE FIX (FIT-TO-PAGE)
   ======================================= */
@media screen and (max-width: 950px) and (orientation: landscape) {
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
}
"""

if "MOBILE LANDSCAPE FIX" not in css:
    css += landscape_css

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Hover effects and landscape fixes applied.")
