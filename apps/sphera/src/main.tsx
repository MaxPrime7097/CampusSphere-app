import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { I18nextProvider } from 'react-i18next'
import { SpheraAuthProvider } from './contexts/SpheraAuthContext'
import { initTheme } from './utils/theme'
import App from './App'
import './index.css'
import i18n from './i18n'

// Initialize user theme
initTheme()

function hydrateSpheraTokensFromUrl() {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : ''
  const hashParams = new URLSearchParams(hash)
  const searchParams = new URLSearchParams(window.location.search)

  const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

  if (!accessToken && !refreshToken) return

  if (accessToken) localStorage.setItem('sphera_access', accessToken)
  if (refreshToken) localStorage.setItem('sphera_refresh', refreshToken)

  // Nettoyer l'URL immédiatement pour ne laisser aucune trace dans la barre d'adresse
  if (window.history.replaceState) {
    window.history.replaceState(null, '', window.location.pathname)
  }

  // Redirect immediately to the dashboard to complete the SSO authentication flow
  window.location.href = '/dashboard'
}

hydrateSpheraTokensFromUrl()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <HelmetProvider>
        <BrowserRouter>
          <SpheraAuthProvider>
            <App />
          </SpheraAuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </I18nextProvider>
  </React.StrictMode>,
)
