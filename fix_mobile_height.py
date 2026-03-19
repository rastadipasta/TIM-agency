import re

css_addition = """
/* =======================================
   MOBILE PORTRAIT & LANDSCAPE OVERFLOW FIX
   ======================================= */
@media screen and (max-width: 768px) {
  .hero {
    min-height: auto !important;
    height: auto !important;
    padding-top: 140px !important;
    padding-bottom: 80px !important;
    display: block !important;
  }
}
"""

with open('style.css', 'a', encoding='utf-8') as f:
    f.write(css_addition)

print("Added mobile hero height fix.")
