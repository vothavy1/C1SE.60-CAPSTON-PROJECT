// Theme Management System
// File này quản lý chế độ sáng/tối cho toàn bộ ứng dụng

(function() {
  'use strict';

  // Load theme ngay khi trang load
  function initTheme() {
    if (!document.body) return 'light';
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(savedTheme + '-mode');
    return savedTheme;
  }

  // Toggle theme
  function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('light-mode') ? 'light' : 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.classList.remove('light-mode', 'dark-mode');
    body.classList.add(newTheme + '-mode');
    
    localStorage.setItem('theme', newTheme);
    
    console.log(`🎨 Theme changed to: ${newTheme}`);
    return newTheme;
  }

  // Setup theme toggle button
  function setupThemeToggle(buttonId = 'themeToggle') {
    const themeToggle = document.getElementById(buttonId);
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  // Export functions
  window.ThemeManager = {
    init: initTheme,
    toggle: toggleTheme,
    setupToggle: setupThemeToggle,
    getCurrentTheme: function() {
      return document.body.classList.contains('light-mode') ? 'light' : 'dark';
    }
  };

  // Auto-init theme khi load
  initTheme();
})();
