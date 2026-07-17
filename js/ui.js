/* =========================================================
   KUNJ RANA — Music Portfolio
   ui.js — Reusable UI Helpers
   ========================================================= */

// ── Skeleton Loaders ───────────────────────────────────────

/**
 * Render N skeleton track card placeholders inside a container.
 * @param {HTMLElement} container
 * @param {number} count
 */
export function renderSkeletons(container, count = 8) {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-cover"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-1-3"></div>
        <div class="skeleton-line w-full tall"></div>
        <div class="skeleton-line w-3-4"></div>
        <div class="skeleton-line w-1-2"></div>
      </div>
    </div>
  `
    )
    .join('');
}

// ── Empty State ────────────────────────────────────────────

/**
 * Render an empty-state message inside a grid container.
 * @param {HTMLElement} container
 * @param {string} [heading]
 * @param {string} [body]
 */
export function renderEmptyState(
  container,
  heading = 'No tracks available yet.',
  body = 'Check back soon — new music is on the way.'
) {
  container.innerHTML = `
    <div class="empty-state" role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"
           aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9 9l6 6M15 9l-6 6"/>
      </svg>
      <h3>${heading}</h3>
      <p>${body}</p>
    </div>
  `;
}

// ── Error State ────────────────────────────────────────────

/**
 * Render an error card with a retry button inside a container.
 * @param {HTMLElement} container
 * @param {Function} retryFn — called when user clicks Retry
 * @param {string} [message]
 */
export function renderErrorState(
  container,
  retryFn,
  message = 'Failed to load tracks. Please try again.'
) {
  container.innerHTML = `
    <div class="error-state" role="alert">
      <div class="error-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             width="28" height="28">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <h3>Something went wrong</h3>
      <p>${message}</p>
      <button class="btn btn-primary btn-sm" id="retry-btn" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             width="14" height="14" aria-hidden="true">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Retry
      </button>
    </div>
  `;
  container.querySelector('#retry-btn')?.addEventListener('click', retryFn);
}

// ── Number Counter Animation ───────────────────────────────

/**
 * Animate a number from 0 → target over `duration` ms.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {number} [duration=1800]
 * @param {string} [suffix=''] e.g. '+', '%'
 */
export function animateCounter(el, target, duration = 1800, suffix = '') {
  const startTime = performance.now();
  const startVal = 0;

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * eased);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ── Toast Notifications ────────────────────────────────────

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a transient toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duration=3500]
 */
export function toast(message, type = 'info', duration = 3500) {
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
      width="16" height="16" style="color:var(--color-success)" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
      width="16" height="16" style="color:var(--color-error)" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
      width="16" height="16" style="color:var(--color-accent)" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  getToastContainer().appendChild(el);

  setTimeout(() => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, duration);
}

// ── Format Duration ────────────────────────────────────────

/**
 * Format seconds to mm:ss string.
 * @param {number} secs
 * @returns {string}
 */
export function formatTime(secs) {
  if (isNaN(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Debounce ───────────────────────────────────────────────

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── Ripple Effect ──────────────────────────────────────────

/**
 * Attach a ripple effect to a button element.
 * @param {HTMLElement} el
 */
export function attachRipple(el) {
  el.classList.add('ripple-container');
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    el.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove(), { once: true });
  });
}

// ── Lazy Image Loading ────────────────────────────────────

/**
 * Set up IntersectionObserver-based lazy loading for images
 * with data-src attribute.
 * @param {HTMLElement} [root=document]
 */
export function initLazyImages(root = document) {
  const imgs = root.querySelectorAll('img[data-src]');
  if (!imgs.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    },
    { rootMargin: '200px' }
  );

  imgs.forEach((img) => obs.observe(img));
}

// ── Truncate Text ─────────────────────────────────────────

/**
 * Truncate a string to maxLength characters, appending ellipsis.
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength).trimEnd() + '…' : str;
}

// ── Share Track ───────────────────────────────────────────

/**
 * Share a track via Web Share API, falling back to clipboard copy.
 * @param {{ title: string, artist: string }} track
 */
export async function shareTrack(track) {
  const shareData = {
    title: `${track.title} — ${track.artist}`,
    text: `Check out "${track.title}" by ${track.artist} on Kunj Rana's portfolio!`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`
      );
      toast('Link copied to clipboard!', 'success');
    }
  } catch {
    // User cancelled share or clipboard failed
  }
}

// ── Waveform Generator ────────────────────────────────────

/**
 * Generate pseudo-random waveform bar heights for visual effect.
 * @param {number} bars
 * @returns {number[]} heights as percentages
 */
export function generateWaveform(bars = 15) {
  return Array.from({ length: bars }, () => Math.floor(Math.random() * 70) + 30);
}

// ── Active Nav Link ───────────────────────────────────────

/**
 * Mark the nav link matching the current page as active.
 */
export function setActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href')?.split('/').pop() || '';
    link.classList.toggle(
      'active',
      href === current || (current === '' && href === 'index.html')
    );
    link.setAttribute('aria-current', href === current ? 'page' : 'false');
  });
}
