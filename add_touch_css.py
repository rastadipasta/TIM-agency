with open('style.css', 'a', encoding='utf-8') as f:
    f.write("""
/* =======================================
   TOUCH SCROLL EFFECTS (mobile)
   ======================================= */
.service-card.touch-active,
.feature-card.touch-active {
  transform: translateY(-8px);
  background: rgba(20, 20, 20, 0.6);
  border-color: rgba(243, 178, 66, 0.2);
  box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px var(--accent-glow);
}

.service-card.touch-active::before,
.feature-card.touch-active::before,
.portfolio-item.touch-active::before {
  transform: translateX(100%);
}

.service-card.touch-active .service-icon,
.feature-card.touch-active .feature-icon {
  background-color: var(--accent-color);
  color: #000;
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 0 15px var(--accent-glow);
}

.portfolio-item.touch-active .portfolio-info {
  transform: translateY(0);
  opacity: 1;
}

.step-mini.touch-active .step-number {
  color: var(--accent-color);
}
""")
print("Touch CSS appended.")
