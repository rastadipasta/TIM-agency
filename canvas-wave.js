/**
 * canvas-wave.js - Interactive 3D Wave using Three.js
 * Renders a dark, tech-themed wave structure using colors sampled from the TIM logo.
 */

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    // Use TIM logo colors for the wave
    const COLOR_PRIMARY = 0x1c232a;   // Background
    const COLOR_SECONDARY = 0x35424b; // Line color
    const COLOR_ACCENT = 0xf3b242;    // Narančasta boja s logotipa

    // Setup Three.js Scene
    const scene = new THREE.Scene();
    // Use the primary background color
    scene.background = new THREE.Color(COLOR_PRIMARY);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Position camera to look down slightly at the wave
    camera.position.z = 50;
    camera.position.y = 15;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create a 3D grid/wave of particles and lines
    const gridSettings = {
        width: 100,
        depth: 100,
        spacing: 4
    };

    const xCount = gridSettings.width / gridSettings.spacing;
    const zCount = gridSettings.depth / gridSettings.spacing;
    
    // Create Geometry
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
        color: COLOR_ACCENT,
        size: 0.8,
        transparent: true,
        opacity: 0.95
    });

    const positions = [];
    const originalPositions = [];
    
    // Generate Grid points
    for (let i = 0; i < xCount; i++) {
        for (let j = 0; j < zCount; j++) {
            const x = (i - xCount / 2) * gridSettings.spacing;
            const z = (j - zCount / 2) * gridSettings.spacing;
            const y = 0;
            
            positions.push(x, y, z);
            originalPositions.push({x: x, y: y, z: z, ang: (x+z)*0.1});
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        const posAttribute = geometry.getAttribute('position');

        // Target mouse sway
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        // Interactive Camera Movement based on mouse
        if(camera.position.x < 30 && camera.position.x > -30) {
            camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.02;
        }
        camera.position.y += (-mouseY * 0.05 - camera.position.y + 15) * 0.02;
        camera.lookAt(scene.position);

        // Animate Wave using Sine math
        for (let i = 0; i < originalPositions.length; i++) {
            const orig = originalPositions[i];
            
            // Complex wave formula combining time and position
            const wave1 = Math.sin(orig.x * 0.1 + elapsedTime * 1.5) * 2;
            const wave2 = Math.cos(orig.z * 0.1 + elapsedTime * 1.0) * 2;
            const wave3 = Math.sin((orig.x + orig.z) * 0.05 + elapsedTime) * 3;
            
            // Mouse repulse interaction (push wave up slightly where mouse is)
            let interaction = 0;
            // Map mouse to 3d space approximately
            let mappedMouseX = (mouseX / windowHalfX) * 40;
            let mappedMouseZ = (mouseY / windowHalfY) * 20;
            
            let dist = Math.sqrt(Math.pow(orig.x - mappedMouseX, 2) + Math.pow(orig.z - mappedMouseZ, 2));
            if (dist < 15) {
                interaction = (15 - dist) * 0.5;
            }

            const newY = wave1 + wave2 + wave3 + interaction - 10; // offset down
            
            posAttribute.setY(i, newY);
        }

        posAttribute.needsUpdate = true;
        
        // Very slow constant rotation
        points.rotation.y = elapsedTime * 0.05;

        renderer.render(scene, camera);
    }

    animate();
});
