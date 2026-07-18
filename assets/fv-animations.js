/**
 * Furniva scroll-reveal animations.
 * Uses IntersectionObserver (not scroll event listeners) so it's cheap -
 * the browser only notifies us when a section actually crosses into view,
 * rather than running code on every scroll frame. Elements with class
 * "fv-reveal" fade + slide up once, the first time they enter the viewport.
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return; // CSS fallback already shows everything statically - nothing to do
  }

  var targets = document.querySelectorAll(
    '.shopify-section .card-wrapper, .shopify-section [class*="__heading"], .fv-reveal-section > *'
  );

  if (!('IntersectionObserver' in window) || targets.length === 0) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fv-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach(function (el) {
    el.classList.add('fv-reveal');
    observer.observe(el);
  });
})();
