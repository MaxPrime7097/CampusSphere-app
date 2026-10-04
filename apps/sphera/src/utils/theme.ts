export type SpheraTheme = 'sombre' | 'clair'

const THEME_KEY = 'sphera_theme'

export function getSavedTheme(): SpheraTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY) as SpheraTheme | null
    if (saved === 'clair' || saved === 'sombre') {
      return saved
    }
  } catch (err) {
    console.warn('[sphera-theme] Failed to read localStorage:', err)
  }
  return 'sombre'
}

export function applyTheme(theme: SpheraTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (err) {
    console.warn('[sphera-theme] Failed to save to localStorage:', err)
  }

  if (theme === 'clair') {
    document.documentElement.setAttribute('data-theme', 'clair')
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.add('dark')
  }
}

export function initTheme(): void {
  const saved = getSavedTheme()
  applyTheme(saved)
}

