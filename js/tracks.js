/* =========================================================
   KUNJ RANA — Music Portfolio
   tracks.js — Track Card Rendering, Search & Filter
   ========================================================= */

import { getTracks } from './api.js';
import { loadQueue, playTrack } from './player.js';
import {
  renderSkeletons,
  renderEmptyState,
  renderErrorState,
  toast,
  debounce,
  shareTrack,
  initLazyImages,
  truncate,
} from './ui.js';

// ── State ──────────────────────────────────────────────────

let allTracks = [];       // Full list from API
let filteredTracks = [];  // Currently displayed
let activeGenre = 'all';
let searchQuery = '';

// ── DOM Elements ───────────────────────────────────────────

const grid    = document.getElementById('tracks-grid');
const search  = document.getElementById('tracks-search');
const filters = document.querySelectorAll('.filter-pill');
const counter = document.getElementById('tracks-count');

// ── Init ───────────────────────────────────────────────────

export async function initTracks() {
  if (!grid) return;
  renderSkeletons(grid, 8);

  try {
    allTracks = await getTracks();
    filteredTracks = [...allTracks];
    renderTracks(filteredTracks);
    loadQueue(filteredTracks, 0);
  } catch (err) {
    console.error('Failed to load tracks:', err);
    renderErrorState(grid, initTracks, err.message);
    return;
  }

  bindSearch();
  bindFilters();
}

// ── Render ─────────────────────────────────────────────────

function renderTracks(tracks) {
  updateCounter(tracks.length);

  if (!tracks.length) {
    renderEmptyState(
      grid,
      'No tracks found.',
      searchQuery
        ? `No results for "${searchQuery}". Try a different search.`
        : 'No tracks in this genre yet. Check back soon!'
    );
    return;
  }

  grid.innerHTML = tracks
    .map((track, idx) => buildTrackCard(track, idx + 1))
    .join('');

  initLazyImages(grid);
  bindCardEvents(tracks);
}

function buildTrackCard(track, num) {
  const cover = track.cover || 'images/default-cover.png';
  const title  = truncate(track.title, 28);
  const artist = truncate(track.artist, 26);

  return `
    <article class="track-card reveal-stagger-child"
             data-id="${track.id}"
             tabindex="0"
             role="listitem"
             aria-label="${track.title} by ${track.artist}">
      <div class="track-cover-wrap">
        <img
          data-src="${cover}"
          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E"
          alt="${track.title} cover"
          loading="lazy"
          width="300" height="300"
        />
        <span class="track-number-badge" aria-hidden="true">#${num}</span>
        <button class="track-play-btn"
                data-id="${track.id}"
                aria-label="Play ${track.title}"
                title="Play">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
               aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
      </div>
      <div class="track-body">
        <span class="track-genre-badge">${track.genre || ''}</span>
        <h3 class="track-title" title="${track.title}">${title}</h3>
        <p class="track-artist">${artist}</p>
        <div class="track-footer">
          <span class="track-duration" aria-label="Duration ${track.duration}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            ${track.duration || '–'}
          </span>
          <button class="track-share-btn"
                  data-id="${track.id}"
                  aria-label="Share ${track.title}"
                  title="Share">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

function bindCardEvents(tracks) {
  // Play buttons
  grid.querySelectorAll('.track-play-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const track = tracks.find((t) => t.id === id);
      if (track) {
        loadQueue(tracks, tracks.indexOf(track));
      }
    });
  });

  // Card click (whole card = play)
  grid.querySelectorAll('.track-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.track-share-btn')) return;
      const id = card.dataset.id;
      const track = tracks.find((t) => t.id === id);
      if (track) {
        loadQueue(tracks, tracks.indexOf(track));
      }
    });

    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Share buttons
  grid.querySelectorAll('.track-share-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const track = tracks.find((t) => t.id === id);
      if (track) shareTrack(track);
    });
  });
}

// ── Search ─────────────────────────────────────────────────

function bindSearch() {
  if (!search) return;
  search.addEventListener(
    'input',
    debounce(() => {
      searchQuery = search.value.trim().toLowerCase();
      applyFilters();
    }, 280)
  );

  // Clear on Escape
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      search.value = '';
      searchQuery = '';
      applyFilters();
    }
  });
}

// ── Filters ────────────────────────────────────────────────

function bindFilters() {
  filters.forEach((pill) => {
    pill.addEventListener('click', () => {
      filters.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      activeGenre = pill.dataset.genre || 'all';
      applyFilters();
    });
  });
}

function applyFilters() {
  filteredTracks = allTracks.filter((track) => {
    const matchesGenre =
      activeGenre === 'all' ||
      track.genre?.toLowerCase() === activeGenre.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      track.title?.toLowerCase().includes(searchQuery) ||
      track.artist?.toLowerCase().includes(searchQuery) ||
      track.genre?.toLowerCase().includes(searchQuery);

    return matchesGenre && matchesSearch;
  });

  renderTracks(filteredTracks);

  // Update queue to filtered set
  if (filteredTracks.length) {
    loadQueue(filteredTracks, 0);
  }
}

// ── Counter ────────────────────────────────────────────────

function updateCounter(count) {
  if (counter) {
    counter.textContent =
      count === 0
        ? 'No tracks'
        : count === 1
        ? '1 track'
        : `${count} tracks`;
  }
}

// ── Featured Track ─────────────────────────────────────────

/**
 * Render the featured track card on the home page.
 * @param {import('./api.js').Track} track
 */
export function renderFeaturedCard(track) {
  const card = document.getElementById('featured-track-card');
  if (!card || !track) return;

  card.querySelector('.featured-title').textContent  = track.title;
  card.querySelector('.featured-artist').textContent = `by ${track.artist}`;
  card.querySelector('.featured-genre').textContent  = track.genre;
  card.querySelector('.featured-desc').textContent   = track.description || '';
  card.querySelector('.featured-duration').textContent = track.duration || '';

  const coverImg = card.querySelector('.featured-cover img');
  if (coverImg) {
    coverImg.src = track.cover || 'images/default-cover.png';
    coverImg.alt = `${track.title} cover`;
  }

  const playBtn = card.querySelector('#featured-play-btn');
  playBtn?.addEventListener('click', () => {
    playTrack(track);
  });

  const addBtn = card.querySelector('#featured-add-queue');
  addBtn?.addEventListener('click', () => {
    import('./player.js').then(({ addToQueue }) => {
      addToQueue(track);
    });
  });
}

// ── Before & After Section ─────────────────────────────────

/**
 * Render before/after comparison cards.
 * @param {import('./api.js').BeforeAfterProject[]} projects
 */
export function renderBeforeAfter(projects) {
  const container = document.getElementById('before-after-grid');
  if (!container) return;

  if (!projects?.length) {
    container.innerHTML = '<p class="text-secondary text-center">No projects yet.</p>';
    return;
  }

  container.innerHTML = projects.map((p) => buildBACard(p)).join('');
  bindBAEvents(container);
}

function buildBACard(project) {
  const waveform = Array.from(
    { length: 15 },
    () => `<div class="ba-wave-bar" style="height:${Math.floor(Math.random() * 70) + 30}%"></div>`
  ).join('');

  return `
    <div class="ba-card reveal" data-before="${project.beforeAudio}" data-after="${project.afterAudio}">
      <div class="ba-header">
        <h3 class="ba-project-name">${project.projectName}</h3>
        <p class="ba-artist">${project.artist}</p>
      </div>

      <div class="ba-audio-section">
        <div class="ba-label before">
          <span class="ba-label-dot"></span>
          Before (Raw Mix)
        </div>
        <div class="ba-player-bar before">
          <button class="ba-play-btn" data-type="before" aria-label="Play before mix">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
          <div class="ba-waveform">${waveform}</div>
          <span class="ba-time">0:00</span>
        </div>
      </div>

      <div class="ba-divider">VS</div>

      <div class="ba-audio-section">
        <div class="ba-label after">
          <span class="ba-label-dot"></span>
          After (Mastered)
        </div>
        <div class="ba-player-bar after">
          <button class="ba-play-btn" data-type="after" aria-label="Play after mix">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
          <div class="ba-waveform">${waveform}</div>
          <span class="ba-time">0:00</span>
        </div>
      </div>
    </div>
  `;
}

function bindBAEvents(container) {
  const baAudio = new Audio();
  let currentCard = null;
  let currentType = null;

  container.querySelectorAll('.ba-play-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.ba-card');
      const type = btn.dataset.type;
      const src  = type === 'before' ? card.dataset.before : card.dataset.after;

      if (currentCard === card && currentType === type && !baAudio.paused) {
        baAudio.pause();
        stopWaveform(card, type);
        setPauseIcon(btn);
        return;
      }

      // Stop previous
      if (currentCard) {
        stopWaveform(currentCard, currentType);
        const prevBtn = currentCard.querySelector(`.ba-play-btn[data-type="${currentType}"]`);
        if (prevBtn) setPlayIcon(prevBtn);
      }

      baAudio.src = src;
      baAudio.play().catch(() => toast('Unable to play preview.', 'error'));
      startWaveform(card, type);
      setStopIcon(btn);
      currentCard = card;
      currentType = type;

      // Update timer
      baAudio.ontimeupdate = () => {
        const timeEl = card.querySelector(`.ba-player-bar.${type} .ba-time`);
        if (timeEl) timeEl.textContent = formatBATime(baAudio.currentTime);
      };

      baAudio.onended = () => {
        stopWaveform(card, type);
        setPlayIcon(btn);
        currentCard = null;
      };
    });
  });
}

function startWaveform(card, type) {
  card.querySelectorAll(`.ba-player-bar.${type} .ba-wave-bar`).forEach((b) =>
    b.classList.add('animating')
  );
}

function stopWaveform(card, type) {
  card.querySelectorAll(`.ba-player-bar.${type} .ba-wave-bar`).forEach((b) =>
    b.classList.remove('animating')
  );
}

function setPlayIcon(btn) {
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/></svg>`;
}

function setStopIcon(btn) {
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
}

function setPauseIcon(btn) { setPlayIcon(btn); }

function formatBATime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
