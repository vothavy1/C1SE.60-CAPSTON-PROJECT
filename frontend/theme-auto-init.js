// AUTO-APPLY THEME TO ALL RECRUITER PAGES
// Add this script at the end of any page that needs theme support

(function autoInitTheme() {
  'use strict';
  
  // 1. Add theme CSS if not already loaded
  if (!document.querySelector('link[href="theme.css"]')) {
    const themeCSS = document.createElement('link');
    themeCSS.rel = 'stylesheet';
    themeCSS.href = 'theme.css';
    document.head.appendChild(themeCSS);
  }
  
  // 2. Init theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.classList.remove('light-mode', 'dark-mode', 'bg-dark', 'text-light', 'bg-light', 'text-dark');
  document.body.classList.add(savedTheme + '-mode', 'transition-colors', 'duration-300');
  
  // 3. Setup theme toggle if button exists
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle && !themeToggle.dataset.initialized) {
    themeToggle.dataset.initialized = 'true';
    themeToggle.addEventListener('click', function() {
      const body = document.body;
      const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      body.classList.remove('light-mode', 'dark-mode');
      body.classList.add(newTheme + '-mode');
      
      localStorage.setItem('theme', newTheme);
      console.log(`🎨 Theme: ${newTheme}`);
    });
  }
  
  // 4. Setup logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn && !logoutBtn.dataset.initialized) {
    logoutBtn.dataset.initialized = 'true';
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.clear();
      sessionStorage.clear();
      location.href = 'index.html?t=' + Date.now();
    });
  }
  
  // 5. Display username
  try {
    const session = JSON.parse(localStorage.getItem('session_user') || 'null');
    if (session && session.name) {
      const userNameEl = document.getElementById('userName');
      if (userNameEl) {
        userNameEl.textContent = `Xin chào, ${session.name}!`;
      }
    }
  } catch(_) {}
  
  console.log('✅ Theme initialized:', savedTheme);
})();
