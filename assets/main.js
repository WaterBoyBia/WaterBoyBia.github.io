const page = document.body.dataset.page;
const nav = document.querySelector('.site-nav');

if (page && page !== 'home') {
  nav?.querySelector(`[href^="/${page}"]`)?.setAttribute('aria-current', 'page');
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
  observer.observe(element);
});
