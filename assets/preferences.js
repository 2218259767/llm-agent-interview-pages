// Runs before paint, with local-only preferences and a safe storage fallback.
try {
  const design = localStorage.getItem('interview-design');
  const theme = localStorage.getItem('interview-color-mode');
  document.documentElement.dataset.design = ['paper', 'clear', 'terminal'].includes(design) ? design : 'paper';
  document.documentElement.dataset.theme = ['light', 'dark'].includes(theme) ? theme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
} catch { /* Reading is available when storage is disabled. */ }
