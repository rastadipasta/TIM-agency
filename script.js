/**
 * script.js - TIM Agency — Award-Winning Redesign
 * Word Rotator, Scroll Reveals, Mobile Menu, Service Accordion
 */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       0. MOBILE MENU
       ========================================================= */
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            mobileMenuBtn.textContent = isOpen ? '✕' : '☰';
        });
    }

    /* =========================================================
       1. NAVBAR SCROLL STATE
       ========================================================= */
    const navbar = document.querySelector('.navbar');

    if (navbar && !navbar.classList.contains('scrolled-always')) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    /* =========================================================
       2. SCROLL REVEAL (IntersectionObserver)
       ========================================================= */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    });

    document.querySelectorAll('.reveal, .stagger-children').forEach(el => {
        revealObserver.observe(el);
    });

    /* =========================================================
       3. WORD ROTATOR (Hero)
       ========================================================= */
    const rotator = document.getElementById('wordRotator');
    if (rotator) {
        const words = ['dizajn', 'brand', 'identitet', 'strategiju', 'web'];
        let currentIndex = 0;

        setInterval(() => {
            currentIndex = (currentIndex + 1) % words.length;
            const wordEl = rotator.querySelector('.word');
            
            // Animate out
            wordEl.style.transform = 'translateY(-100%)';
            wordEl.style.opacity = '0';
            
            setTimeout(() => {
                wordEl.textContent = words[currentIndex];
                wordEl.style.transform = 'translateY(100%)';
                
                // Force reflow
                wordEl.offsetHeight;
                
                // Animate in
                requestAnimationFrame(() => {
                    wordEl.style.transform = 'translateY(0)';
                    wordEl.style.opacity = '1';
                });
            }, 400);
        }, 2500);
    }

    /* =========================================================
       4. TOUCH SCROLL EFFECTS (Mobile)
       ========================================================= */
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (isTouchDevice) {
        const touchObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('touch-active');
                } else {
                    entry.target.classList.remove('touch-active');
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.service-strip, .portfolio-item').forEach(el => {
            touchObserver.observe(el);
        });
    }

    /* =========================================================
       5. MAGNETIC BUTTON EFFECT (Interactive Content)
       ========================================================= */
    const magneticBtns = document.querySelectorAll('.btn');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            // Calculate mouse position relative to center of button
            const x = (e.clientX - rect.left) - rect.width / 2;
            const y = (e.clientY - rect.top) - rect.height / 2;
            
            // Apply slight translation based on mouse movement
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            // Reset to natural position
            btn.style.transform = `translate(0px, 0px)`;
        });
    });

    /* =========================================================
       6. PARALLAX EFFECT (Subpage Hero)
       ========================================================= */
    const subpageHero = document.querySelector('.subpage-hero');
    if (subpageHero) {
        window.addEventListener('scroll', () => {
            const scroll = window.scrollY;
            // Only logic when near top
            if (scroll < 800) {
                const h1 = subpageHero.querySelector('h1');
                const p = subpageHero.querySelector('p');
                if (h1) h1.style.transform = `translateY(${scroll * 0.25}px)`;
                if (p) p.style.transform = `translateY(${scroll * 0.15}px)`;
            }
        });
    }

});
