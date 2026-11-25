/*
 * Aplica el tema antes del primer pintado para evitar parpadeos.
 * Es un archivo externo (no inline) para poder usar una CSP sin 'unsafe-inline' en scripts.
 * La clave debe coincidir con THEME_STORAGE_KEY en src/lib/theme.ts.
 */
(function () {
  var theme = null;
  try {
    theme = window.localStorage.getItem('portfolio-theme');
  } catch (error) {
    theme = null;
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
