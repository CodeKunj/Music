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
});
