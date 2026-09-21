export type SpheraTheme = 'system' | 'sombre' | 'clair';

const THEME_KEY = 'sphera_theme';

export function getSavedTheme(): SpheraTheme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'system' || saved === 'sombre' || saved === 'clair') {
    return saved;
  }
  return 'sombre';
}

export function applyTheme(theme: SpheraTheme): void {
  localStorage.setItem(THEME_KEY, theme);
  const root = document.documentElement;

  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'sombre' : 'clair');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function initTheme(): void {
  const saved = getSavedTheme();
  applyTheme(saved);

  // Listen for system theme changes if set to 'system'
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (getSavedTheme() === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'sombre' : 'clair');
    }
  });
}
