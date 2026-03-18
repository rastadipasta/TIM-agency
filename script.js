/**
 * script.js - TIM Agency
 * Micro-interactions & Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    
    /* =========================================================
       0. MOBILE MENU TOGGLE
       ========================================================= */
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if(navbar) navbar.classList.toggle('menu-open');
        });
    }

    /* =========================================================
       1. INTERSECTION OBSERVER (Fade-In & Slide-Up on Scroll)
       ========================================================= */
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15 // Triggers when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("appear");
                observer.unobserve(entry.target); // Run animation only once
            }
        });
    }, observerOptions);

    const faders = document.querySelectorAll('.fade-in, .fade-in-up');
    faders.forEach(fader => {
        observer.observe(fader);
    });

    /* =========================================================
       2. NAVBAR GLASSMORPHISM ON SCROLL
       ========================================================= */
    // navbar is already defined at top of file
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* =========================================================
       3. MAGNETIC BUTTONS (Micro-interaction)
       ========================================================= */
    const magneticElements = document.querySelectorAll('.magnetic');
    
    magneticElements.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const position = el.getBoundingClientRect();
            // Calculate mouse position relative to center of element
            const x = e.clientX - position.left - position.width / 2;
            const y = e.clientY - position.top - position.height / 2;
            
            // Moderate the magnetic pull (divisor controls strength)
            el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        el.addEventListener('mouseout', () => {
            // Reset to default smoothly via CSS transition
            el.style.transform = 'translate(0px, 0px)';
        });
    });

    /* =========================================================
       4. 3D TILT EFFECT ON PORTFOLIO CARDS
       ========================================================= */
    const tiltCards = document.querySelectorAll('.tilt-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angle (-5 to 5 degrees max)
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        });
    });
});
