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
        const words = ['web', 'dizajn', 'brand', 'identitet', 'strategiju'];
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
    /* =========================================================
       7. GSAP & SCROLLTRIGGER
       ========================================================= */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // A. Staggered Text Mask Reveal
        const revealTexts = document.querySelectorAll('.gsap-reveal-text');
        revealTexts.forEach(text => {
            // Split text superficially by words for staggering
            const words = text.innerText.split(' ');
            text.innerHTML = '';
            words.forEach(word => {
                const mask = document.createElement('span');
                mask.className = 'gsap-mask';
                mask.style.marginRight = '0.25em';
                const span = document.createElement('span');
                span.innerText = word;
                mask.appendChild(span);
                text.appendChild(mask);
            });

            gsap.to(text.querySelectorAll('.gsap-mask span'), {
                scrollTrigger: {
                    trigger: text,
                    start: 'top 85%',
                },
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            });
        });

        // B. Image Parallax Effects
        const parallaxImages = document.querySelectorAll('.gsap-img-parallax');
        parallaxImages.forEach(img => {
            gsap.fromTo(img, 
                { y: '-10%' },
                {
                    y: '10%',
                    ease: "none",
                    scrollTrigger: {
                        trigger: img.parentElement,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true
                    }
                }
            );
        });

        // C. Theme Color Inversion (Light/Dark Toggle)
        const themeTriggers = document.querySelectorAll('.theme-trigger');
        themeTriggers.forEach(trigger => {
            ScrollTrigger.create({
                trigger: trigger,
                start: 'top 50%',
                end: 'bottom 50%',
                onEnter: () => document.body.classList.add('theme-light'),
                onLeave: () => document.body.classList.remove('theme-light'),
                onEnterBack: () => document.body.classList.add('theme-light'),
                onLeaveBack: () => document.body.classList.remove('theme-light')
            });
        });

        // E. Horizontal Scroll (Portfolio Page)
        const gallery = document.querySelector('.horizontal-gallery');
        const track = document.querySelector('.gallery-track');
        
        if (gallery && track) {
            gsap.to(track, {
                x: () => -(track.scrollWidth - window.innerWidth),
                ease: "none",
                scrollTrigger: {
                    trigger: gallery,
                    start: "top top",
                    end: () => `+=${track.scrollWidth}`,
                    pin: true,
                    scrub: 1,
                    invalidateOnRefresh: true,
                }
            });
        }
    }

});
