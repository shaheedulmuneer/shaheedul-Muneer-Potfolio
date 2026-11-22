// Design enhancements: nav hide/show, active link, scroll progress, section reveals
(function () {
  const nav = document.getElementById('smNav');
  const bar = document.getElementById('smProgress');
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > 400);
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (!('IntersectionObserver' in window)) return;

  // Highlight the nav link of the section in view
  const links = document.querySelectorAll('.sm-links a');
  const map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  const spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && map[e.target.id]) {
        links.forEach(function (l) { l.classList.remove('is-active'); });
        map[e.target.id].classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(map).forEach(function (id) {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  // Soft reveal for section headers
  const targets = document.querySelectorAll('.behind-header-grid, .suite-heading, .footer-card');
  const rev = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); rev.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  targets.forEach(function (t) { t.classList.add('sm-reveal'); rev.observe(t); });
})();
