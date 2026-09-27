/* A seek-optimized, all-keyframe video driven only by scroll. */
(() => {
  const section = document.querySelector('.scroll-process');
  if (!section || !window.gsap || !window.ScrollTrigger) return;
  const video = section.querySelector('video');
  const progress = section.querySelector('.scroll-process__progress span');
  gsap.registerPlugin(ScrollTrigger);
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    const playhead = { progress: 0 };
    let active = true;
    let loading = false;
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
      section.classList.add('is-static');
      tween.scrollTrigger?.kill();
      tween.kill();
      ScrollTrigger.refresh();
    }
    video.addEventListener('loadeddata', schedule);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    function load() {
      if (loading) return;
      loading = true;
      // Use the same-origin URL allowed by the production media-src policy.
      // Browser buffering and HTTP range requests handle the seekable MP4.
      video.preload = 'auto';
      video.src = video.dataset.src;
      video.load();
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
      section.classList.remove('is-ready', 'is-static');
    };
  });
})();
