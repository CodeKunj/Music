/* =========================================================
   KUNJ RANA — Music Portfolio
   player.js — Audio Player State Machine
   ========================================================= */

import { formatTime, toast } from './ui.js';

// ── State ──────────────────────────────────────────────────

const state = {
  queue: [],          // Track[] currently loaded
  currentIndex: -1,  // index in queue
  isPlaying: false,
  isShuffled: false,
  repeatMode: 'off', // 'off' | 'one' | 'all'
  volume: 1,
  isMuted: false,
  playbackSpeed: 1,
};

// ── DOM References ─────────────────────────────────────────

const audio = new Audio();
let playerEl, progressFill, seekInput, timeCurrentEl, timeTotalEl,
    coverEl, titleEl, artistEl, playBtn, prevBtn, nextBtn,
    shuffleBtn, repeatBtn, volumeBtn, volumeInput, speedBtn;

// ── Init ───────────────────────────────────────────────────

export function initPlayer() {
  playerEl     = document.getElementById('audio-player');
  if (!playerEl) return;

  progressFill  = playerEl.querySelector('.player-progress-fill');
  seekInput     = playerEl.querySelector('.player-seek');
  timeCurrentEl = playerEl.querySelector('.player-time.start');
  timeTotalEl   = playerEl.querySelector('.player-time.end');
  coverEl       = playerEl.querySelector('.player-cover');
  titleEl       = playerEl.querySelector('.player-title');
  artistEl      = playerEl.querySelector('.player-artist');
  playBtn       = playerEl.querySelector('#btn-play');
  prevBtn       = playerEl.querySelector('#btn-prev');
  nextBtn       = playerEl.querySelector('#btn-next');
  shuffleBtn    = playerEl.querySelector('#btn-shuffle');
  repeatBtn     = playerEl.querySelector('#btn-repeat');
  volumeBtn     = playerEl.querySelector('#btn-volume');
  volumeInput   = playerEl.querySelector('.player-volume');
  speedBtn      = playerEl.querySelector('.player-speed');

  bindEvents();
  restoreFromSession();
  bindKeyboard();

  // Hide player initially if no track loaded
  if (state.currentIndex === -1) {
    playerEl.classList.add('hidden');
  }
}

// ── Bind DOM Events ────────────────────────────────────────

function bindEvents() {
  playBtn?.addEventListener('click', togglePlay);
  prevBtn?.addEventListener('click', playPrev);
  nextBtn?.addEventListener('click', playNext);
  shuffleBtn?.addEventListener('click', toggleShuffle);
  repeatBtn?.addEventListener('click', cycleRepeat);
  volumeBtn?.addEventListener('click', toggleMute);
  volumeInput?.addEventListener('input', onVolumeChange);
  speedBtn?.addEventListener('click', cycleSpeed);

  seekInput?.addEventListener('input', onSeek);

  // Progress track click area
  playerEl?.querySelector('.player-progress-track')?.addEventListener('click', onProgressClick);

  // Audio events
  audio.addEventListener('timeupdate', onTimeUpdate);
  audio.addEventListener('loadedmetadata', onMetaLoaded);
  audio.addEventListener('ended', onEnded);
  audio.addEventListener('error', onAudioError);
  audio.addEventListener('play', () => syncPlayState(true));
  audio.addEventListener('pause', () => syncPlayState(false));
  audio.addEventListener('waiting', () => playerEl?.classList.add('loading'));
  audio.addEventListener('canplay', () => playerEl?.classList.remove('loading'));
}

// ── Keyboard Shortcuts ─────────────────────────────────────

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input / textarea
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        audio.currentTime = Math.max(audio.currentTime - 5, 0);
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'n':
      case 'N':
        playNext();
        break;
      case 'p':
      case 'P':
        playPrev();
        break;
    }
  });
}

// ── Public API ─────────────────────────────────────────────

/**
 * Load a list of tracks into the queue and start playing from index.
 * @param {import('./api.js').Track[]} tracks
 * @param {number} [startIndex=0]
 */
export function loadQueue(tracks, startIndex = 0) {
  state.queue = [...tracks];
  playAt(startIndex);
}

/**
 * Play a single track (adds it to queue if not present).
 * @param {import('./api.js').Track} track
 */
export function playTrack(track) {
  const idx = state.queue.findIndex((t) => t.id === track.id);
  if (idx !== -1) {
    playAt(idx);
  } else {
    state.queue.push(track);
    playAt(state.queue.length - 1);
  }
}

/**
 * Add a track to the end of the queue.
 * @param {import('./api.js').Track} track
 */
export function addToQueue(track) {
  const exists = state.queue.find((t) => t.id === track.id);
  if (!exists) {
    state.queue.push(track);
    toast(`"${track.title}" added to queue`, 'info');
  }
}

// ── Internal Playback ──────────────────────────────────────

function playAt(index) {
  if (index < 0 || index >= state.queue.length) return;
  state.currentIndex = index;
  const track = state.queue[index];

  audio.src = track.audio;
  audio.playbackRate = state.playbackSpeed;
  audio.volume = state.isMuted ? 0 : state.volume;

  updatePlayerUI(track);
  playerEl?.classList.remove('hidden');

  audio.play().catch((err) => {
    console.warn('Playback failed:', err);
    toast('Unable to play this track.', 'error');
  });

  saveToSession();
}

function togglePlay() {
  if (!audio.src) return;
  audio.paused ? audio.play() : audio.pause();
}

function playNext() {
  if (!state.queue.length) return;
  let nextIdx;
  if (state.isShuffled) {
    nextIdx = randomOther(state.currentIndex, state.queue.length);
  } else {
    nextIdx = state.currentIndex + 1;
    if (nextIdx >= state.queue.length) {
      if (state.repeatMode === 'all') {
        nextIdx = 0;
      } else {
        audio.pause();
        return;
      }
    }
  }
  playAt(nextIdx);
}

function playPrev() {
  if (!state.queue.length) return;
  // If > 3s in, restart current track
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let prevIdx = state.currentIndex - 1;
  if (prevIdx < 0) prevIdx = state.repeatMode === 'all' ? state.queue.length - 1 : 0;
  playAt(prevIdx);
}

function onEnded() {
  if (state.repeatMode === 'one') {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
}

// ── Controls ───────────────────────────────────────────────

function toggleShuffle() {
  state.isShuffled = !state.isShuffled;
  shuffleBtn?.classList.toggle('active', state.isShuffled);
  shuffleBtn?.setAttribute('aria-pressed', state.isShuffled);
  toast(state.isShuffled ? 'Shuffle on' : 'Shuffle off', 'info');
}

function cycleRepeat() {
  const modes = ['off', 'all', 'one'];
  const idx = modes.indexOf(state.repeatMode);
  state.repeatMode = modes[(idx + 1) % modes.length];
  updateRepeatBtn();
  toast(`Repeat: ${state.repeatMode}`, 'info');
}

function updateRepeatBtn() {
  if (!repeatBtn) return;
  repeatBtn.classList.toggle('active', state.repeatMode !== 'off');
  repeatBtn.setAttribute('aria-label', `Repeat: ${state.repeatMode}`);
  // Show "1" badge on repeat one
  const badge = repeatBtn.querySelector('.repeat-one-badge');
  if (badge) badge.style.display = state.repeatMode === 'one' ? '' : 'none';
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.volume = state.isMuted ? 0 : state.volume;
  updateVolumeIcon();
  if (volumeInput) volumeInput.value = state.isMuted ? 0 : state.volume;
}

function onVolumeChange() {
  state.volume = parseFloat(volumeInput.value);
  state.isMuted = state.volume === 0;
  audio.volume = state.volume;
  updateVolumeIcon();
}

function updateVolumeIcon() {
  if (!volumeBtn) return;
  const isMuted = state.isMuted || state.volume === 0;
  volumeBtn.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
  volumeBtn.innerHTML = isMuted
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
         <line x1="23" y1="9" x2="17" y2="15"/>
         <line x1="17" y1="9" x2="23" y2="15"/>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
         <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
         <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
       </svg>`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function cycleSpeed() {
  const idx = SPEEDS.indexOf(state.playbackSpeed);
  state.playbackSpeed = SPEEDS[(idx + 1) % SPEEDS.length];
  audio.playbackRate = state.playbackSpeed;
  if (speedBtn) speedBtn.textContent = `${state.playbackSpeed}×`;
  toast(`Speed: ${state.playbackSpeed}×`, 'info');
}

// ── Seek ───────────────────────────────────────────────────

function onSeek() {
  const pct = parseFloat(seekInput.value) / 100;
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
  }
}

function onProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
  }
}

// ── Audio Event Handlers ───────────────────────────────────

function onTimeUpdate() {
  const current = audio.currentTime;
  const duration = audio.duration || 0;
  const pct = duration ? (current / duration) * 100 : 0;

  if (progressFill) progressFill.style.width = `${pct}%`;
  if (seekInput) seekInput.value = pct;
  if (timeCurrentEl) timeCurrentEl.textContent = formatTime(current);
}

function onMetaLoaded() {
  if (timeTotalEl) timeTotalEl.textContent = formatTime(audio.duration);
}

function onAudioError() {
  toast('Error loading audio stream.', 'error');
  syncPlayState(false);
}

// ── UI Sync ────────────────────────────────────────────────

function syncPlayState(playing) {
  state.isPlaying = playing;
  playerEl?.classList.toggle('playing', playing);

  if (!playBtn) return;
  playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  playBtn.innerHTML = playing
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
         <rect x="6" y="4" width="4" height="16" rx="1"/>
         <rect x="14" y="4" width="4" height="16" rx="1"/>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
         <polygon points="5 3 19 12 5 21 5 3"/>
       </svg>`;
}

function updatePlayerUI(track) {
  if (coverEl) {
    coverEl.src = track.cover || 'images/default-cover.png';
    coverEl.alt = `${track.title} by ${track.artist}`;
  }
  if (titleEl)  titleEl.textContent  = track.title  || 'Unknown Title';
  if (artistEl) artistEl.textContent = track.artist || 'Unknown Artist';
  if (timeTotalEl) timeTotalEl.textContent = track.duration || '0:00';
  if (timeCurrentEl) timeCurrentEl.textContent = '0:00';
  if (progressFill) progressFill.style.width = '0%';
  if (seekInput) seekInput.value = 0;
  if (speedBtn) speedBtn.textContent = `${state.playbackSpeed}×`;
  if (volumeInput) volumeInput.value = state.volume;
  updateRepeatBtn();
  updateVolumeIcon();

  // Update document title
  document.title = `${track.title} — Kunj Rana`;
}

// ── Session Persistence ────────────────────────────────────

const SESSION_KEY = 'kunjrana_player';

function saveToSession() {
  const data = {
    queue: state.queue,
    currentIndex: state.currentIndex,
    volume: state.volume,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    playbackSpeed: state.playbackSpeed,
    currentTime: audio.currentTime,
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch { /* quota exceeded or private mode */ }
}

function restoreFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.queue = data.queue || [];
    state.volume = data.volume ?? 1;
    state.isShuffled = data.isShuffled ?? false;
    state.repeatMode = data.repeatMode || 'off';
    state.playbackSpeed = data.playbackSpeed ?? 1;

    if (state.queue.length && data.currentIndex >= 0) {
      state.currentIndex = data.currentIndex;
      const track = state.queue[state.currentIndex];
      audio.src = track.audio;
      audio.currentTime = data.currentTime || 0;
      audio.volume = state.volume;
      audio.playbackRate = state.playbackSpeed;
      updatePlayerUI(track);
      playerEl?.classList.remove('hidden');
      // Do NOT auto-play on page restore (browser policy)
    }

    shuffleBtn?.classList.toggle('active', state.isShuffled);
    updateRepeatBtn();
    updateVolumeIcon();
    if (volumeInput) volumeInput.value = state.volume;
    if (speedBtn) speedBtn.textContent = `${state.playbackSpeed}×`;
  } catch { /* ignore */ }
}

// ── Utility ────────────────────────────────────────────────

function randomOther(currentIdx, length) {
  if (length <= 1) return 0;
  let r;
  do { r = Math.floor(Math.random() * length); } while (r === currentIdx);
  return r;
}

// ── Expose state for other modules ────────────────────────

export function getPlayerState() { return { ...state }; }
export function getCurrentTrack() { return state.queue[state.currentIndex] || null; }
