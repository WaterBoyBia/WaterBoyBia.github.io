export const nextIndex = (index, total) => (index + 1) % total;
export const previousIndex = (index, total) => (index - 1 + total) % total;
export const shouldAutoplay = ({ userPaused, interactionPaused, pageHidden, reducedMotion }) =>
  !userPaused && !interactionPaused && !pageHidden && !reducedMotion;

const pad = (value) => String(value).padStart(2, '0');

function initCarousel(root) {
  const slides = [...root.querySelectorAll('[data-slide]')];
  const current = root.querySelector('[data-carousel-current]');
  const controls = root.querySelector('.photo-controls');
  const previous = root.querySelector('[data-carousel-action="previous"]');
  const toggle = root.querySelector('[data-carousel-action="toggle"]');
  const next = root.querySelector('[data-carousel-action="next"]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0;
  let timer = null;
  const failedSlides = new Set();
  const state = {
    userPaused: false,
    interactionPaused: false,
    pageHidden: document.hidden,
    reducedMotion,
  };

  const show = (newIndex) => {
    if (failedSlides.has(newIndex)) {
      if (failedSlides.size < slides.length) show(nextIndex(newIndex, slides.length));
      return;
    }
    const targetImage = slides[newIndex].querySelector('img');
    if (!targetImage.complete) {
      targetImage.loading = 'eager';
      targetImage.addEventListener('load', () => show(newIndex), { once: true });
      return;
    }
    index = newIndex;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    current.textContent = pad(index + 1);
    slides[nextIndex(index, slides.length)].querySelector('img').loading = 'eager';
  };

  const stop = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };

  const sync = () => {
    stop();
    if (shouldAutoplay(state)) {
      timer = window.setInterval(() => show(nextIndex(index, slides.length)), 3000);
    }
  };

  previous.addEventListener('click', () => {
    show(previousIndex(index, slides.length));
    sync();
  });
  next.addEventListener('click', () => {
    show(nextIndex(index, slides.length));
    sync();
  });
  toggle.addEventListener('click', () => {
    state.userPaused = !state.userPaused;
    toggle.setAttribute('aria-pressed', String(state.userPaused));
    toggle.setAttribute('aria-label', state.userPaused ? '继续自动播放' : '暂停自动播放');
    toggle.textContent = state.userPaused ? '播放' : '暂停';
    sync();
  });
  controls.addEventListener('mouseenter', () => {
    state.interactionPaused = true;
    sync();
  });
  controls.addEventListener('mouseleave', () => {
    state.interactionPaused = false;
    sync();
  });
  document.addEventListener('visibilitychange', () => {
    state.pageHidden = document.hidden;
    sync();
  });
  slides.forEach((slide, slideIndex) => {
    slide.querySelector('img').addEventListener('error', () => {
      failedSlides.add(slideIndex);
      slide.classList.add('has-error');
      if (slideIndex === index) show(nextIndex(index, slides.length));
    });
  });

  if (reducedMotion) {
    toggle.disabled = true;
    toggle.textContent = '静止';
    toggle.setAttribute('aria-label', '已根据系统设置关闭自动播放');
  }

  show(0);
  sync();
}

function initLightbox(dialog) {
  const items = [...document.querySelectorAll('[data-lightbox-item]')];
  const image = dialog.querySelector('[data-lightbox-image]');
  const album = dialog.querySelector('[data-lightbox-album]');
  const counter = dialog.querySelector('[data-lightbox-counter]');
  const close = dialog.querySelector('[data-lightbox-close]');
  const previous = dialog.querySelector('[data-lightbox-previous]');
  const next = dialog.querySelector('[data-lightbox-next]');
  let index = 0;
  let trigger = null;

  const show = (newIndex) => {
    index = newIndex;
    const item = items[index];
    const thumbnail = item.querySelector('img');
    image.src = item.href;
    image.alt = thumbnail.alt;
    album.textContent = item.dataset.album;
    counter.textContent = `${pad(index + 1)} / ${pad(items.length)}`;
  };

  items.forEach((item, itemIndex) => item.addEventListener('click', (event) => {
    event.preventDefault();
    trigger = item;
    show(itemIndex);
    dialog.showModal();
    close.focus();
  }));
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => show(previousIndex(index, items.length)));
  next.addEventListener('click', () => show(nextIndex(index, items.length)));
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    trigger?.focus();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(previousIndex(index, items.length));
    if (event.key === 'ArrowRight') show(nextIndex(index, items.length));
    if (event.key === 'Escape') dialog.close();
  });
  image.addEventListener('error', () => {
    const thumbnail = items[index].querySelector('img');
    if (image.src !== thumbnail.src) image.src = thumbnail.src;
  });
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
  document.querySelectorAll('[data-lightbox-dialog]').forEach(initLightbox);
}
