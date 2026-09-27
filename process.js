/* Full-frame sequence. Only scroll advances the playhead; no autoplay. */
(() => {
  const section = document.querySelector('.scroll-process');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const canvas = section.querySelector('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  if (!context || !window.createImageBitmap) return;
  gsap.registerPlugin(ScrollTrigger);
  const base = section.dataset.frames;
  const count = 451;
  const progress = section.querySelector('.scroll-process__progress span');

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const controller = new AbortController();
    const blobs = new Map();
    const decoded = new Map();
    const fetching = new Set();
    const decoding = new Set();
    const failed = new Set();
    const playhead = { frame: 0 };
    let active = true;
    let nearby = false;
    let target = 0;
    let displayed = -1;
    let paintRequest = 0;
    let direction = 1;

    // Prioritize the current frame, then look ahead in the scroll direction.
    function neighborhood(radius) {
      const frames = [target];
      for (let offset = 1; offset <= radius; offset++) {
        frames.push(target + offset * direction, target - offset * direction);
      }
      return frames.filter(frame => frame >= 0 && frame < count);
    }

    function paint() {
      paintRequest = 0;
      if (!active || !decoded.size) return;
      // Keep moving with the closest available frame while the exact one decodes.
      const frame = [...decoded.keys()].reduce((best, value) =>
        Math.abs(value - target) < Math.abs(best - target) ? value : best);
      if (displayed === frame) return;
      context.drawImage(decoded.get(frame), 0, 0, canvas.width, canvas.height);
      displayed = frame;
      section.classList.add('is-ready');
      canvas.dataset.frame = String(frame);
    }

    function schedulePaint() {
      if (!paintRequest && active) paintRequest = requestAnimationFrame(paint);
    }

    async function decode(frame) {
      decoding.add(frame);
      try {
        const bitmap = await createImageBitmap(blobs.get(frame));
        if (!active) { bitmap.close(); return; }
        decoded.set(frame, bitmap);
        // Bound decoded pixels to about 110 MB, instead of decoding the whole GIF.
        while (decoded.size > 24) {
          const farthest = [...decoded.keys()].sort((a, b) =>
            Math.abs(b - target) - Math.abs(a - target))[0];
          decoded.get(farthest).close();
          decoded.delete(farthest);
        }
        schedulePaint();
      } catch {
        if (active) failed.add(frame);
      } finally {
        decoding.delete(frame);
        if (active) prepare();
      }
    }

    async function fetchFrame(frame) {
      fetching.add(frame);
      try {
        const response = await fetch(`${base}/${String(frame).padStart(3, '0')}.webp?v=2`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Frame unavailable');
        const blob = await response.blob();
        if (active) blobs.set(frame, blob);
      } catch {
        if (active) failed.add(frame);
      } finally {
        fetching.delete(frame);
        if (active) prepare();
      }
    }

    function prepare() {
      if (!active || !nearby) return;
      for (const frame of neighborhood(10)) {
        if (decoding.size >= 2) break;
        if (blobs.has(frame) && !decoded.has(frame) && !decoding.has(frame) && !failed.has(frame)) decode(frame);
      }
      // Warm small compressed frames in the background, four requests at a time.
      const fetchOrder = [...neighborhood(24), ...Array.from({ length: count }, (_, i) => i)];
      for (const frame of fetchOrder) {
        if (fetching.size >= 4) break;
        if (!blobs.has(frame) && !fetching.has(frame) && !failed.has(frame)) fetchFrame(frame);
      }
    }

    const tween = gsap.to(playhead, {
      frame: count - 1,
      ease: 'none',
      onUpdate: () => {
        const next = Math.round(playhead.frame);
        if (next !== target) direction = next > target ? 1 : -1;
        target = next;
        progress.style.transform = `scaleX(${playhead.frame / (count - 1)})`;
        schedulePaint();
        prepare();
      },
      scrollTrigger: {
        trigger: section,
        pin: section.querySelector('.scroll-process__stage'),
        start: 'top top',
        end: () => `+=${Math.max(document.documentElement.clientHeight * 5, 3200)}`,
        scrub: 0.18,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      if (nearby) { prepare(); schedulePaint(); }
    }, { rootMargin: '200% 0px' });
    observer.observe(section);
    document.fonts.ready.then(() => { if (active) tween.scrollTrigger.refresh(); });

    return () => {
      active = false;
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(paintRequest);
      tween.scrollTrigger?.kill();
      tween.kill();
      decoded.forEach(bitmap => bitmap.close());
      decoded.clear();
      blobs.clear();
      section.classList.remove('is-ready');
      delete canvas.dataset.frame;
    };
  });
})();
