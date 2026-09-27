/* A seek-optimized, all-keyframe video driven only by scroll. */
(() => {
  const section = document.querySelector('.scroll-process');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const video = section.querySelector('video');
  const progress = section.querySelector('.scroll-process__progress span');
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const controller = new AbortController();
    const playhead = { progress: 0 };
    let active = true;
    let loading = false;
    let objectURL;
    let request = 0;
    let failed = false;

    function seek() {
      request = 0;
      if (!active || failed || video.readyState < 2 || video.seeking) return;
      const time = playhead.progress * Math.max(0, video.duration - 1 / 60);
      // Never interrupt an in-flight seek: seeked picks up the latest scroll target.
      if (Math.abs(video.currentTime - time) > 1 / 120) video.currentTime = time;
      else section.classList.add('is-ready');
    }
    function schedule() {
      if (active && !request) request = requestAnimationFrame(seek);
    }
    function onSeeked() {
      if (!active) return;
      section.classList.add('is-ready');
      schedule();
    }
    function onError() {
      failed = true;
      section.classList.remove('is-ready');
    }
    video.addEventListener('loadeddata', schedule);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    async function load() {
      if (loading) return;
      loading = true;
      try {
        // One compressed download; subsequent seeks never wait on network ranges.
        const response = await fetch(video.dataset.src, { signal: controller.signal });
        if (!response.ok) throw new Error('Process video unavailable');
        const blob = await response.blob();
        if (!active) return;
        objectURL = URL.createObjectURL(blob);
        video.src = objectURL;
        video.load();
      } catch {
        if (active) onError();
      }
    }
    const tween = gsap.to(playhead, {
      progress: 1,
      ease: 'none',
      onUpdate: () => {
        progress.style.transform = `scaleX(${playhead.progress})`;
        schedule();
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
      if (entry.isIntersecting) { load(); observer.disconnect(); }
    }, { rootMargin: '200% 0px' });
    observer.observe(section);
    document.fonts.ready.then(() => { if (active) tween.scrollTrigger?.refresh(); });
    return () => {
      active = false;
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(request);
      tween.scrollTrigger?.kill();
      tween.kill();
      video.removeEventListener('loadeddata', schedule);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (objectURL) URL.revokeObjectURL(objectURL);
      section.classList.remove('is-ready');
    };
  });
})();
