/* =========================================================
   KUNJ RANA — Music Portfolio
   app.js — Global Init: Navbar, IntersectionObserver,
            Hamburger, Back-to-Top, Number Counters
   ========================================================= */

import { setActiveNavLink, animateCounter, initLazyImages } from './ui.js';
import { initPlayer } from './player.js';

// ── Bootstrap ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initPlayer();
  initNavbar();
  initHamburger();
  initRevealObserver();
  initCounterObserver();
  initBackToTop();
  initLazyImages();
  setActiveNavLink();
  initTestimonialsCarousel();
  initContactForm();
  initRippleButtons();
  initPageSpecific();
});

// ── Navbar ─────────────────────────────────────────────────

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    lastScroll = y;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initial state
}

// ── Hamburger Menu ─────────────────────────────────────────

function initHamburger() {
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close when a mobile link is clicked
  mobileMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (
      !hamburger.contains(e.target) &&
      !mobileMenu.contains(e.target) &&
      mobileMenu.classList.contains('open')
    ) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

// ── IntersectionObserver — Reveal Animations ───────────────

function initRevealObserver() {
  const targets = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger'
  );
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

// ── IntersectionObserver — Number Counters ─────────────────

function initCounterObserver() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          animateCounter(el, target, 1800, suffix);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

// ── Back To Top ────────────────────────────────────────────

function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Testimonials Carousel ──────────────────────────────────

function buildTestimonialCards(testimonials) {
  const track = document.querySelector('.testimonials-track');
  if (!track || !testimonials?.length) return;

  const starSVG = (filled) => `
    <svg viewBox="0 0 24 24" ${filled ? 'fill="currentColor"' : 'fill="none" stroke="currentColor" stroke-width="2"'} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>`;

  track.innerHTML = testimonials.map((t, idx) => {
    const stars = Array.from({ length: 5 })
      .map((_, i) => starSVG(i < (t.rating || 5)))
      .join('');
    const avatar = t.avatar || 'images/default-cover.png';
    return `
      <article class="testimonial-card${idx === 0 ? ' active' : ''}" role="listitem">
        <div class="testimonial-stars" aria-label="${t.rating || 5} star rating">${stars}</div>
        <blockquote class="testimonial-quote">"${t.quote}"</blockquote>
        <div class="testimonial-author">
          <img src="${avatar}" alt="${t.name}" class="testimonial-avatar" loading="lazy" />
          <div>
            <p class="testimonial-name">${t.name}</p>
            <p class="testimonial-role">${t.role || ''}</p>
          </div>
        </div>
      </article>`;
  }).join('');
}

function initTestimonialsCarousel() {
  const track = document.querySelector('.testimonials-track');
  if (!track) return;

  const dotsWrap = document.querySelector('.carousel-dots');
  const prevBtn  = document.querySelector('#carousel-prev');
  const nextBtn  = document.querySelector('#carousel-next');

  let current   = 0;
  let autoTimer = null;

  function getVisibleCount() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 992) return 2;
    return 3;
  }

  function getCardWidth() {
    const card = track.querySelector('.testimonial-card');
    if (!card) return 0;
    // Read actual computed gap from the track element
    const gap = parseFloat(getComputedStyle(track).gap) || 24;
    return card.offsetWidth + gap;
  }

  function buildDots() {
    if (!dotsWrap) return;
    const cards = track.querySelectorAll('.testimonial-card');
    const totalSlides = Math.ceil(cards.length / getVisibleCount());
    dotsWrap.innerHTML = Array.from({ length: totalSlides })
      .map((_, i) => `<button class="carousel-dot${i === 0 ? ' active' : ''}"
              data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`)
      .join('');
    dotsWrap.querySelectorAll('.carousel-dot').forEach((dot) => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index)));
    });
  }

  function goTo(idx) {
    const cards = track.querySelectorAll('.testimonial-card');
    if (!cards.length) return;
    const vc    = getVisibleCount();
    const total = Math.ceil(cards.length / vc);
    current = ((idx % total) + total) % total;

    // Move track by (current group index) × (one card width incl. gap) × visibleCount
    track.style.transform = `translateX(-${current * getCardWidth() * vc}px)`;

    cards.forEach((c, i) => {
      c.classList.toggle('active', i === current * vc);
    });

    dotsWrap?.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });

    resetAuto();
  }

  function startAuto() {
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', startAuto);

  // Rebuild dots + reset on resize
  window.addEventListener('resize', () => {
    buildDots();
    goTo(0);
  }, { passive: true });

  buildDots();
  startAuto();
}

// ── Contact Form ───────────────────────────────────────────

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());

    // Basic validation
    if (!data.name?.trim() || !data.email?.trim() || !data.message?.trim()) {
      import('./ui.js').then(({ toast }) => toast('Please fill in all required fields.', 'error'));
      return;
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(data.email)) {
      import('./ui.js').then(({ toast }) => toast('Please enter a valid email address.', 'error'));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const { submitContact } = await import('./api.js');
      await submitContact(data);
      import('./ui.js').then(({ toast }) =>
        toast('Message sent! Kunj will be in touch soon.', 'success')
      );
      form.reset();
    } catch {
      import('./ui.js').then(({ toast }) =>
        toast('Failed to send. Please email directly.', 'error')
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}

// ── Ripple Buttons ─────────────────────────────────────────

function initRippleButtons() {
  document.querySelectorAll('.btn-primary, .btn-outline').forEach((btn) => {
    import('./ui.js').then(({ attachRipple }) => attachRipple(btn));
  });
}

// ── Page-Specific Init ─────────────────────────────────────

async function initPageSpecific() {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') {
    await initHomePage();
  } else if (page === 'tracks.html') {
    const { initTracks } = await import('./tracks.js');
    await initTracks();
  } else if (page === 'services.html') {
    await initServicesPage();
  }
}

async function initHomePage() {
  try {
    const { getFeaturedTrack, getBeforeAfterProjects, getTestimonials } = await import('./api.js');
    const { renderFeaturedCard, renderBeforeAfter } = await import('./tracks.js');

    const [featured, baProjects, testimonials] = await Promise.allSettled([
      getFeaturedTrack(),
      getBeforeAfterProjects(),
      getTestimonials(),
    ]);

    if (featured.status     === 'fulfilled') renderFeaturedCard(featured.value);
    if (baProjects.status   === 'fulfilled') renderBeforeAfter(baProjects.value);

    // Inject API testimonials and re-initialise the carousel
    if (testimonials.status === 'fulfilled' && testimonials.value?.length) {
      buildTestimonialCards(testimonials.value);
      initTestimonialsCarousel(); // re-run after cards are in the DOM
    }
  } catch (err) {
    console.warn('Home page data load error:', err);
  }
}

async function initServicesPage() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  try {
    const { getServices } = await import('./api.js');
    const services = await getServices();
    if (!services?.length) return;
    grid.innerHTML = services.map(buildServiceCard).join('');
  } catch {
    // Services are server-driven but fallback is already in HTML
  }
}

function buildServiceCard(service) {
  const features = (service.features || [])
    .map(
      (f) => `
      <li class="service-feature">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ${f}
      </li>`
    )
    .join('');

  return `
    <div class="service-card reveal">
      <div class="service-icon" aria-hidden="true">
        ${getServiceIcon(service.icon)}
      </div>
      <h3 class="service-name">${service.name}</h3>
      <p class="service-desc">${service.description}</p>
      <ul class="service-features">${features}</ul>
      <a href="contact.html?service=${encodeURIComponent(service.name)}"
         class="btn btn-outline"
         aria-label="Book ${service.name}">
        Book Now
      </a>
    </div>
  `;
}

function getServiceIcon(key) {
  const icons = {
    mixing: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    mastering: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`,
    production: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>`,
    podcast: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/></svg>`,
    cleanup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  };
  return icons[key] || icons.mixing;
}
