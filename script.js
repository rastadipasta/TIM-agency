/**
 * script.js - TIM Agency — Award-Winning Redesign
 * Word Rotator, Scroll Reveals, Mobile Menu, Service Accordion
 */

document.addEventListener("DOMContentLoaded", () => {
    // Sprečava GSAP "glitch" trzavice na dnu kad se URL-traka mobitela pojavi/sakrije
    if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.config({ ignoreMobileResize: true });
    }

    /* =========================================================
       0. MOBILE MENU
       ========================================================= */
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
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
       3. INDEX MARQUEE INTRO & LOOP
       ========================================================= */
    const indexMarquee = document.getElementById('index-marquee');
    if (indexMarquee) {
        gsap.fromTo(indexMarquee, 
            { x: '50vw' }, 
            { x: '-15%', duration: (window.innerWidth/2 + 0.15 * indexMarquee.scrollWidth) / (indexMarquee.scrollWidth/2 / 15), ease: "none", onComplete: () => {
                gsap.fromTo(indexMarquee, 
                    { x: '-15%' }, 
                    { x: '-65%', duration: 15, ease: "none", repeat: -1 }
                );
            } }
        );
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
       5. MAGNETIC BUTTON EFFECT & i-DOT
       ========================================================= */
    const magneticBtns = document.querySelectorAll('.btn:not(.no-magnetic)');
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = (e.clientX - rect.left) - rect.width / 2;
            const y = (e.clientY - rect.top) - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });

    /* Parallax effect removed per user request for static subpages */

    /* =========================================================
       7. GSAP & SCROLLTRIGGER
       ========================================================= */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Subpage Hero Entry Animation
        if (document.querySelector('.subpage-hero')) {
            gsap.from(".subpage-hero .marquee-track", {
                y: 150,
                opacity: 0,
                duration: 2,
                ease: "expo.out",
                delay: 0.2
            });
            gsap.from(".subpage-hero-subtitle", {
                y: 30,
                opacity: 0,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.8
            });
        }

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
            // Trigger za kretanje prema dolje (LATER: Top 40% umjesto 60%)
            ScrollTrigger.create({
                trigger: trigger,
                start: 'top 40%',
                end: 'bottom top',
                onEnter: () => document.body.classList.add('theme-light'),
                onLeave: () => document.body.classList.remove('theme-light')
            });
            // Trigger za kretanje prema gore (LATER: Top 80% umjesto 60%)
            ScrollTrigger.create({
                trigger: trigger,
                start: 'top 80%',
                end: 'bottom -20%',
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
