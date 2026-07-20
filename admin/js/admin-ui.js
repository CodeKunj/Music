export function setActiveSidebarLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.sidebar-nav a');
  links.forEach(link => {
    if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href').replace('./', '/admin/'))) {
      link.classList.add('active');
    } else if (currentPath.endsWith('/admin/') && link.getAttribute('href').includes('dashboard.html')) {
      link.classList.add('active');
    }
  });
}

export function initMobileSidebar() {
  // Assuming there is a toggle button and a sidebar element in the DOM
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('.admin-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

export function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

// Auto-init UI things when imported
document.addEventListener('DOMContentLoaded', () => {
  setActiveSidebarLink();
  initMobileSidebar();

  // Global modal close listener
  document.addEventListener('click', (e) => {
    // Close on button click
    if (e.target.closest('[data-close-modal]')) {
      const modal = e.target.closest('.modal-overlay');
      if (modal) closeModal(modal);
    }
    // Close on overlay click
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target);
    }
  });
});

export function toast(msg, type = 'info') {
  alert(msg);
}

export async function confirm(msg) {
  return window.confirm(msg);
}

export function openModal(modal) {
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
}

export function closeModal(modal) {
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
}

export function initUploadZone(zone, previewEl) {
  if (!zone) return;
  const input = zone.querySelector('input[type="file"]');
  if (!input) return;
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && previewEl) {
      previewEl.style.display = 'block';
      if (file.type.startsWith('image/')) {
        previewEl.innerHTML = `<img src="${URL.createObjectURL(file)}" style="max-height:100px;" />`;
      } else {
        previewEl.innerHTML = `<span>${file.name}</span>`;
      }
    }
  });
}

export function showSkeletonRows(tbody, cols, rows = 3) {
  if (!tbody) return;
  tbody.innerHTML = Array(rows).fill(`<tr>${Array(cols).fill('<td>Loading...</td>').join('')}</tr>`).join('');
}

export function createAudioPreview(url) {
  return `<audio controls src="${url}" style="height:30px; max-width:150px;"></audio>`;
}

export function starsHtml(rating) {
  const r = parseInt(rating) || 5;
  return Array(5).fill(0).map((_, i) => 
    `<svg viewBox="0 0 24 24" fill="${i < r ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--color-accent);margin-right:2px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>`
  ).join('');
}
