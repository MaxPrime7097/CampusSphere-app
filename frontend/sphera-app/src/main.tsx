import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
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

  params.delete('access_token')
  params.delete('refresh_token')
  const cleanUrl = `${window.location.origin}${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`
  window.history.replaceState({}, document.title, cleanUrl)
}

hydrateSpheraTokensFromUrl()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SpheraAuthProvider>
        <App />
      </SpheraAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
