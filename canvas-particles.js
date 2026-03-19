/**
 * canvas-particles.js - Interactive Particle Network using HTML5 Canvas
 * Renders an interactive, constellation-like network in orange (#f3b242) on black.
 */

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;

    const COLOR_PARTICLE = "#f3b242";
    const COLOR_LINE_BASE = "rgba(243, 178, 66, "; 
    
    // Configuration
    // Particle count is calculated dynamically per resize
    const CONNECTION_DISTANCE = 110;
    const MOUSE_INTERACTION_RADIUS = 150;
    const PARTICLES_SPEED = 0.5;

    let particles = [];
    let mouse = {
        x: null,
        y: null,
        radius: MOUSE_INTERACTION_RADIUS
    };

    function resizeCanvas() {
        width = window.innerWidth;
        height = document.querySelector('.hero').offsetHeight;
        canvas.width = width;
        canvas.height = height;
    }

    // Initialize Canvas Size
    resizeCanvas();
    let lastWidth = window.innerWidth;
    window.addEventListener("resize", () => {
        // Only recreate particles if the width changes (orientation change)
        // This prevents the animation from jumping when scrolling on mobile (address bar collapse)
        if (window.innerWidth !== lastWidth) {
            lastWidth = window.innerWidth;
            resizeCanvas();
            initParticles();
        }
    });

    // Track Mouse
    canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });

    canvas.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle Class
    class Particle {
        constructor(x, y, dx, dy, size) {
            this.x = x;
            this.y = y;
            this.dx = dx;
            this.dy = dy;
            this.size = size;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 30) + 1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = COLOR_PARTICLE;
            ctx.fill();
        }

        update() {
            // Check boundaries
            if (this.x > width || this.x < 0) this.dx = -this.dx;
            if (this.y > height || this.y < 0) this.dy = -this.dy;

            // Move particle
            this.x += this.dx;
            this.y += this.dy;

            // Mouse interaction: Pushing particles away
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                
                // Repel distance
                const maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                
                if (distance < maxDistance) {
                    this.x -= forceDirectionX * force * this.density * 0.5;
                    this.y -= forceDirectionY * force * this.density * 0.5;
                }
            }


            this.draw();
        }
    }

    // Initialize Particles Array
    function initParticles() {
        particles = [];
        const isMobile = window.innerWidth <= 768;
        const currentParticleCount = isMobile ? 20 : Math.min(window.innerWidth / 10, 150);
        
        for (let i = 0; i < currentParticleCount; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let dx = (Math.random() - 0.5) * PARTICLES_SPEED;
            let dy = (Math.random() - 0.5) * PARTICLES_SPEED;
            
            particles.push(new Particle(x, y, dx, dy, size));
        }
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
        }
        
        connectParticles();
    }

    // Connect close particles with lines
    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                             + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
                
                if (distance < (CONNECTION_DISTANCE * CONNECTION_DISTANCE)) {
                    opacityValue = 1 - (distance / (CONNECTION_DISTANCE * CONNECTION_DISTANCE));
                    ctx.strokeStyle = COLOR_LINE_BASE + opacityValue + ")";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Start
    initParticles();
    animate();
});
