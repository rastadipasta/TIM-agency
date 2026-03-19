with open('style.css', 'a', encoding='utf-8') as f:
    f.write("""
/* =======================================
   SUBPAGES REDESIGN
   ======================================= */

.subpage-hero {
  padding: 180px 5% 100px 5%;
  position: relative;
  border-bottom: 1px solid var(--border-color);
  background: radial-gradient(circle at top left, rgba(243, 178, 66, 0.05), transparent 60%);
}

.breadcrumb {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.breadcrumb span {
  margin: 0 8px;
  color: var(--border-color);
}

.breadcrumb a {
  transition: color var(--transition-fast);
}

.breadcrumb a:hover {
  color: var(--accent-color);
}

.subpage-hero h1 {
  font-size: 4rem;
  margin-bottom: 20px;
  line-height: 1.1;
  position: relative;
  display: inline-block;
}

.subpage-hero h1::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 10%;
  height: 80%;
  width: 4px;
  background-color: var(--accent-color);
  border-radius: 4px;
}

.subpage-hero p {
  font-size: 1.25rem;
  color: var(--text-muted);
  max-width: 700px;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 50px;
}

.feature-card {
  background: rgba(13, 13, 13, 0.4);
  backdrop-filter: blur(12px);
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(243, 178, 66, 0.2);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(243, 178, 66, 0.1);
}

.feature-icon {
  color: var(--accent-color);
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 12px;
}

.feature-card p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

/* Mini Process */
.process-mini {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-top: 40px;
  position: relative;
}

.process-mini::before {
  content: '';
  position: absolute;
  top: 30px;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--border-color);
  z-index: -1;
}

.step-mini {
  background: var(--bg-primary);
  padding-right: 20px;
}

.step-number {
  font-size: 3rem;
  font-weight: 800;
  color: rgba(243, 178, 66, 0.15); /* very faint accent */
  line-height: 1;
  margin-bottom: 16px;
  transition: color var(--transition-normal);
}

.step-mini:hover .step-number {
  color: var(--accent-color);
}

.step-mini h4 {
  font-size: 1.25rem;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.step-mini p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Modern CTA Section */
.modern-cta {
  background: linear-gradient(135deg, rgba(26,26,26,0.8), rgba(0,0,0,0.9));
  border: 1px solid rgba(243, 178, 66, 0.15);
  border-radius: 24px;
  padding: 60px 5%;
  text-align: center;
  margin: 60px auto 100px auto;
  position: relative;
  overflow: hidden;
}

.modern-cta::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(243, 178, 66, 0.1) 0%, transparent 60%);
  z-index: 0;
  pointer-events: none;
}

.modern-cta-content {
  position: relative;
  z-index: 1;
}

.modern-cta h2 {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.modern-cta p {
  color: var(--text-muted);
  font-size: 1.125rem;
  margin-bottom: 32px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 768px) {
  .subpage-hero h1 { font-size: 2.5rem; }
  .features-grid, .process-mini { grid-template-columns: 1fr; }
  .process-mini::before { display: none; }
  .modern-cta { padding: 40px 5%; }
}
""")
print("CSS appended successfully.")
