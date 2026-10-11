const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

const bootScreen = document.querySelector('.boot-screen');
const bootNumber = document.querySelector('.boot-percent');
const bootBar = document.querySelector('.boot-track i');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (bootScreen && reducedMotion) {
  bootScreen.remove();
} else if (bootScreen) {
  let bootValue = 0;
  let pageReady = document.readyState === 'complete';
  window.addEventListener('load', () => { pageReady = true; }, { once: true });
  const bootTimer = window.setInterval(() => {
    bootValue = pageReady ? Math.min(100, bootValue + 8) : Math.min(92, bootValue + 3);
    bootNumber.textContent = `${String(bootValue).padStart(2, '0')}%`;
    bootBar.style.width = `${bootValue}%`;
    if (bootValue === 100) {
      window.clearInterval(bootTimer);
      bootScreen.classList.add('boot-screen--exit');
      window.setTimeout(() => bootScreen.remove(), 700);
    }
  }, 24);
}

document.querySelectorAll('.reveal, .slide-in').forEach((el, index) => {
  if (el.classList.contains('achievement-card')) {
    el.style.setProperty('--slide-delay', `${Math.min(index * 90, 360)}ms`);
  }
  observer.observe(el);
});

const counterObserver = new IntersectionObserver((entries, currentObserver) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const counter = entry.target;
    const target = Number(counter.dataset.count);
    const decimals = Number(counter.dataset.decimals || 0);
    if (reducedMotion) {
      counter.textContent = target.toFixed(decimals);
      currentObserver.unobserve(counter);
      return;
    }
    const started = performance.now();
    const duration = target > 100 ? 1500 : 1100;
    const animateCount = (now) => {
      const progress = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      counter.textContent = (target * eased).toFixed(decimals);
      if (progress < 1) requestAnimationFrame(animateCount);
      else counter.textContent = target.toFixed(decimals);
    };
    requestAnimationFrame(animateCount);
    currentObserver.unobserve(counter);
  });
}, { threshold: 0.8 });
document.querySelectorAll('.count-up').forEach((counter) => counterObserver.observe(counter));

const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

window.addEventListener('pointermove', (event) => {
  document.body.style.setProperty('--mx', `${event.clientX}px`);
  document.body.style.setProperty('--my', `${event.clientY}px`);
  const hero = document.querySelector('.reference-hero');
  if (hero && event.pointerType === 'mouse') {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    document.body.style.setProperty('--hero-pointer-x', `${x * -16}px`);
    document.body.style.setProperty('--hero-pointer-y', `${y * -12}px`);
  }
}, { passive: true });

const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.setProperty('--tilt-x', `${-y * 5}deg`);
    card.style.setProperty('--tilt-y', `${x * 6}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});

const projectTrack = document.querySelector('.project-grid');
document.querySelector('.project-next')?.addEventListener('click', () => {
  projectTrack.scrollBy({ left: projectTrack.clientWidth * 0.82, behavior: 'smooth' });
});
document.querySelector('.project-prev')?.addEventListener('click', () => {
  projectTrack.scrollBy({ left: -projectTrack.clientWidth * 0.82, behavior: 'smooth' });
});

let dragStartX = 0;
let dragStartScroll = 0;
let isDraggingProjects = false;
let draggedProjects = false;
projectTrack.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'mouse' || event.target.closest('button')) return;
  isDraggingProjects = true;
  draggedProjects = false;
  dragStartX = event.clientX;
  dragStartScroll = projectTrack.scrollLeft;
  projectTrack.setPointerCapture(event.pointerId);
});
projectTrack.addEventListener('pointermove', (event) => {
  if (!isDraggingProjects) return;
  const distance = event.clientX - dragStartX;
  if (Math.abs(distance) > 5) draggedProjects = true;
  if (draggedProjects) projectTrack.scrollLeft = dragStartScroll - distance;
});
const stopProjectDrag = () => { isDraggingProjects = false; };
projectTrack.addEventListener('pointerup', stopProjectDrag);
projectTrack.addEventListener('pointercancel', stopProjectDrag);
projectTrack.addEventListener('click', (event) => {
  if (!draggedProjects) return;
  event.preventDefault();
  event.stopPropagation();
  draggedProjects = false;
}, true);

document.querySelectorAll('.portrait-control').forEach((control) => {
  const portrait = control.querySelector('img');
  let pointerStartX = 0;
  let startingAngle = 0;
  let dragged = false;
  let suppressClick = false;

  control.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    pointerStartX = event.clientX;
    startingAngle = Number(control.dataset.angle || 0);
    dragged = false;
    control.classList.remove('is-spinning');
    control.setPointerCapture(event.pointerId);
  });
  control.addEventListener('pointermove', (event) => {
    if (!control.hasPointerCapture(event.pointerId)) return;
    const delta = event.clientX - pointerStartX;
    if (Math.abs(delta) > 3) dragged = true;
    if (!dragged) return;
    const angle = startingAngle + delta * 0.8;
    control.dataset.angle = String(angle);
    control.style.setProperty('--portrait-angle', `${angle}deg`);
    control.classList.add('has-rotation');
    control.classList.add('is-dragging');
  });
  const finishDrag = (event) => {
    if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
    if (!dragged) return;
    suppressClick = true;
    control.classList.remove('is-dragging');
    control.classList.remove('is-spinning');
    control.classList.add('has-rotation');
  };
  control.addEventListener('pointerup', finishDrag);
  control.addEventListener('pointercancel', finishDrag);
  control.addEventListener('click', () => {
    if (suppressClick) { suppressClick = false; return; }
    control.classList.remove('has-rotation');
    control.style.removeProperty('--portrait-angle');
    control.dataset.angle = '0';
    control.classList.remove('is-spinning');
    void control.offsetWidth;
    control.classList.add('is-spinning');
  });
  control.addEventListener('animationend', (event) => {
    if (event.target !== portrait) return;
    control.classList.remove('is-spinning');
  });
});

const updateScrollProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  document.body.style.setProperty('--scroll-progress', progress);
  document.body.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.75);
  const heroProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
  document.body.style.setProperty('--hero-lift', `${heroProgress * 54}px`);
  document.body.style.setProperty('--hero-scale', `${1 - heroProgress * 0.09}`);
  document.body.style.setProperty('--hero-copy-y', `${heroProgress * -28}px`);
  document.body.style.setProperty('--hero-copy-opacity', `${1 - heroProgress * 0.35}`);
  document.body.style.setProperty('--hero-aside-lift', `${heroProgress * -19}px`);
  const alternateRole = heroProgress > 0.25;
  if (alternateRole !== document.body.classList.contains('hero-scrolled')) {
    document.body.classList.toggle('hero-scrolled', alternateRole);
    document.querySelectorAll('.role-line').forEach((line) => {
      line.textContent = alternateRole ? line.dataset.alt : line.dataset.primary;
    });
  }
};
document.querySelectorAll('.role-line').forEach((line) => { line.dataset.primary = line.textContent; });
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();
