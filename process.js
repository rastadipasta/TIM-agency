/* The supplied GIF, sampled every three frames. Scroll is the only playback clock. */
(() => {
  const section = document.querySelector('.scroll-process');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const canvas = section.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  gsap.registerPlugin(ScrollTrigger);
  const base = section.dataset.frames;
  const cache = new Map();
  const count = 176;
  const progress = section.querySelector('.scroll-process__progress span');
  let target = 0;
  let displayed = -1;
  let drawing = false;
  let enabled = false;
  async function render() {
    if (drawing || !enabled || displayed === target) return;
    drawing = true;
    const frame = target;
    try {
      let img = cache.get(frame);
      if (!img) {
        img = new Image();
        img.src = `${base}/${String(frame).padStart(3, '0')}.webp`;
        await img.decode();
        cache.set(frame, img);
        // Bound decoded image memory, including on long or repeated scrolls.
        if (cache.size > 12) cache.delete(cache.keys().next().value);
      }
      if (enabled && target === frame) {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        displayed = frame;
        section.classList.add('is-ready');
      }
    } catch {
      // Keep the poster or last valid frame if an asset cannot be loaded.
      displayed = frame;
    } finally {
      drawing = false;
      if (enabled && target !== displayed && target !== frame) render();
    }
  }
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    enabled = true;
    const trigger = ScrollTrigger.create({
      trigger: section,
      pin: section.querySelector('.scroll-process__stage'),
      start: 'top top',
      end: () => `+=${window.innerHeight * 5}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        target = Math.round(self.progress * (count - 1));
        progress.style.transform = `scaleX(${self.progress})`;
        render();
      },
    });
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) render();
    }, { rootMargin: '100% 0px' });
    observer.observe(section);
    return () => {
      enabled = false;
      observer.disconnect();
      trigger.kill();
      section.classList.remove('is-ready');
      displayed = -1;
      cache.clear();
    };
  });
})();
