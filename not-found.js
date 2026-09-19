// Keep the shared fallback in the language of the requested section.
if (/^\/en(?:\/|$)/i.test(window.location.pathname)) {
  document.documentElement.lang = 'en';
  document.title = '404 — Page not found | TIMDSGN';
  document.getElementById('page-title').textContent = '404 — Page not found';
  document.getElementById('message').textContent = "Looks like this page isn't part of our design yet. No worries, good ideas always find their way.";
  document.getElementById('home-label').textContent = 'Back to home';
  document.querySelector('.wordmark').setAttribute('aria-label', 'TIMDSGN — Home');
  document.querySelectorAll('a').forEach((link) => { link.href = '/en/'; });
}
