const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav a');
const langButtons = document.querySelectorAll('.lang-btn');
const translatableElements = document.querySelectorAll('[data-es][data-en]');
const revealElements = document.querySelectorAll('.reveal');
const parallaxItems = document.querySelectorAll('.parallax-item');
const counterElements = document.querySelectorAll('[data-count]');

const STORAGE_KEY = 'huskytours-language';

function setMenuOpenState(isOpen) {
  if (!menuToggle || !nav) return;

  nav.classList.toggle('is-open', isOpen);
  menuToggle.classList.toggle('is-open', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
}

function closeMenu() {
  setMenuOpenState(false);
}

function toggleMenu() {
  if (!menuToggle) return;
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  setMenuOpenState(!isExpanded);
}

function getInitialLanguage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'es' || saved === 'en') return saved;

  const browserLang = navigator.language?.toLowerCase() || 'es';
  return browserLang.startsWith('en') ? 'en' : 'es';
}

function setLanguage(lang) {
  const normalizedLang = lang === 'en' ? 'en' : 'es';

  document.documentElement.lang = normalizedLang;
  localStorage.setItem(STORAGE_KEY, normalizedLang);

  translatableElements.forEach((element) => {
    const translatedText = element.dataset[normalizedLang];
    if (translatedText) {
      element.textContent = translatedText;
    }
  });

  langButtons.forEach((button) => {
    const isActive = button.dataset.lang === normalizedLang;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  if (menuToggle) {
    menuToggle.setAttribute(
      'aria-label',
      normalizedLang === 'en' ? 'Open menu' : 'Abrir menú'
    );
  }

  if (counterElements.length) {
    counterElements.forEach((element) => {
      if (element.dataset.animated === 'true') {
        renderCounterFinal(element);
      }
    });
  }
}

function formatCount(value) {
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'es-CR';
  return new Intl.NumberFormat(locale).format(value);
}

function renderCounterFinal(element) {
  const target = Number(element.dataset.count || 0);
  const suffix = element.dataset.suffix || '';
  element.textContent = `${formatCount(target)}${suffix}`;
}

function setupCounters() {
  if (!counterElements.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    counterElements.forEach((element) => {
      renderCounterFinal(element);
      element.dataset.animated = 'true';
    });
    return;
  }

  const animateCounter = (element) => {
    if (element.dataset.animated === 'true') return;
    const target = Number(element.dataset.count || 0);
    const suffix = element.dataset.suffix || '';
    const duration = 1200;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      element.textContent = `${formatCount(current)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.dataset.animated = 'true';
      }
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counterElements.forEach((element) => observer.observe(element));
}

function setupRevealAnimations() {
  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function setupParallax() {
  if (!parallaxItems.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const updateParallax = () => {
    const viewportCenter = window.innerHeight / 2;

    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = sectionCenter - viewportCenter;
      const offset = Math.max(-35, Math.min(35, -distance * 0.12));

      item.style.setProperty('--parallax-offset', `${offset}px`);
    });
  };

  updateParallax();
  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', updateParallax);
}

if (menuToggle) {
  menuToggle.addEventListener('click', toggleMenu);
}

navLinks.forEach((link) => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('click', (event) => {
  if (!nav || !menuToggle) return;

  const clickedInsideNav = nav.contains(event.target);
  const clickedToggle = menuToggle.contains(event.target);

  if (!clickedInsideNav && !clickedToggle) {
    closeMenu();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
  }
});

langButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const lang = button.dataset.lang;
    setLanguage(lang);
  });
});

setLanguage(getInitialLanguage());
setupRevealAnimations();
setupParallax();
setupCounters();
