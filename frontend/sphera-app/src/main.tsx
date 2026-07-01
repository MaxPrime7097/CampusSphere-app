import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { SpheraAuthProvider } from './contexts/SpheraAuthContext'
import App from './App'
import './index.css'

function hydrateSpheraTokensFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken && !refreshToken) return

  if (accessToken) localStorage.setItem('sphera_access', accessToken)
  if (refreshToken) localStorage.setItem('sphera_refresh', refreshToken)

  // Redirect immediately to the dashboard to complete the SSO authentication flow
  window.location.href = '/dashboard'
}

hydrateSpheraTokensFromUrl()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <SpheraAuthProvider>
          <App />
        </SpheraAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
)
