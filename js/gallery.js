/* =========================================================
   js/gallery.js — Public Gallery Page Logic
   ========================================================= */

const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5000/api'
  : '/api';

// ── State ───────────────────────────────────────────────────────
let allItems   = [];

// ── DOM Refs ────────────────────────────────────────────────────
const grid      = document.getElementById('gallery-grid');
const skeleton  = document.getElementById('gallery-skeleton');
const emptyMsg  = document.getElementById('gallery-empty');
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lb-img');
const lbTitle   = document.getElementById('lb-title');
const lbCat     = document.getElementById('lb-category');
const lbDesc    = document.getElementById('lb-description');
const lbLink    = document.getElementById('lb-link');
const lbClose   = document.getElementById('lb-close');
const lbPrev    = document.getElementById('lb-prev');
const lbNext    = document.getElementById('lb-next');

let lbCurrentIndex = 0;
let displayedItems = [];

// ── Fetch Gallery Items ─────────────────────────────────────────
async function loadGallery() {
  try {
    const res = await fetch(`${API_BASE}/gallery`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allItems = await res.json();
    renderGrid(allItems);
  } catch (err) {
    console.error('Gallery load error:', err);
    if (skeleton) skeleton.style.display = 'none';
    if (emptyMsg) {
      emptyMsg.style.display = 'block';
      emptyMsg.querySelector('p').textContent = 'Could not load gallery. Please try again later.';
    }
  }
}

// ── Render Grid ─────────────────────────────────────────────────
function renderGrid(items) {
  if (skeleton) skeleton.style.display = 'none';

  if (!grid) return;
  grid.innerHTML = '';

  filteredItems = items;
  displayedItems = items;

  if (!items.length) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.setAttribute('data-idx', idx);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${item.title}`);

    card.innerHTML = `
      <div class="gallery-card-img-wrap">
        <img src="${item.imageUrl}" alt="${escHtml(item.title)}" loading="lazy" class="gallery-card-img" />
        <div class="gallery-card-overlay">
          <div class="gallery-card-overlay-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            <span>View</span>
          </div>
        </div>
      </div>
      <div class="gallery-card-info">
        <h3 class="gallery-card-title">${escHtml(item.title)}</h3>
        ${item.description ? `<p class="gallery-card-desc">${escHtml(item.description)}</p>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openLightbox(idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx); }
    });

    grid.appendChild(card);
  });

  // Stagger entrance animations
  requestAnimationFrame(() => {
    const cards = grid.querySelectorAll('.gallery-card');
    cards.forEach((c, i) => {
      c.style.animationDelay = `${i * 60}ms`;
      c.classList.add('gallery-card-animate');
    });
  });
}


// ── Lightbox ────────────────────────────────────────────────────
function openLightbox(idx) {
  lbCurrentIndex = idx;
  updateLightbox();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lbClose.focus();
}

function updateLightbox() {
  const item = displayedItems[lbCurrentIndex];
  if (!item) return;

  lbImg.src       = item.imageUrl;
  lbImg.alt       = item.title;
  lbTitle.textContent = item.title;
  if (lbCat) lbCat.textContent = '';
  lbDesc.textContent  = item.description || '';
  lbDesc.style.display = item.description ? 'block' : 'none';

  if (lbLink) {
    if (item.projectLink) {
      lbLink.href = item.projectLink;
      lbLink.style.display = 'inline-flex';
    } else {
      lbLink.style.display = 'none';
    }
  }

  lbPrev.disabled = lbCurrentIndex === 0;
  lbNext.disabled = lbCurrentIndex === displayedItems.length - 1;
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

if (lbClose) lbClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

if (lbPrev) lbPrev.addEventListener('click', () => {
  if (lbCurrentIndex > 0) { lbCurrentIndex--; updateLightbox(); }
});
if (lbNext) lbNext.addEventListener('click', () => {
  if (lbCurrentIndex < filteredItems.length - 1) { lbCurrentIndex++; updateLightbox(); }
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  { if (lbCurrentIndex > 0) { lbCurrentIndex--; updateLightbox(); } }
  if (e.key === 'ArrowRight') { if (lbCurrentIndex < displayedItems.length - 1) { lbCurrentIndex++; updateLightbox(); } }
});

// ── Helpers ─────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ────────────────────────────────────────────────────────
loadGallery();
