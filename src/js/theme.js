// Theme management with system preference + persistence
(function() {
  const STORAGE_KEY = 'calcultad-theme';
  
  function getSystemPref() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
  
  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch(e) { return null; }
  }
  
  function storeTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch(e) {}
  }
  
  function currentTheme() {
    return getStoredTheme() || getSystemPref();
  }
  
  // Apply immediately (no flash)
  applyTheme(currentTheme());
  
  // Toggle handler
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-theme-toggle]');
    if (!btn) return;
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  });
  
  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!getStoredTheme()) {
      const theme = e.matches ? 'dark' : 'light';
      applyTheme(theme);
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }
  });
})();
