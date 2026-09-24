import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, clearTokens, getToken, setTokens } from '../services/spheraApi'

interface SpheraUser {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string | null
  is_profile_complete?: boolean
}

interface SpheraAuthContextType {
  user: SpheraUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (u: SpheraUser | null) => void
  logout: () => void
}

const SpheraAuthContext = createContext<SpheraAuthContextType | undefined>(undefined)

// ─── Silent SSO via hidden iframe ───────────────────────────────
// Loads campussphere.app/sso/bridge in a hidden iframe.
// If the user is already logged in on CampusSphere, the bridge sends
// the tokens back via postMessage and we can log them in automatically.

const CS_ORIGINS = [
  "https://campussphere.app",
  "https://www.campussphere.app",
  "http://localhost:5173",
]

function attemptSilentSSO(): Promise<{ access: string; refresh: string } | null> {
  return new Promise((resolve) => {
    const isLocal = ["localhost", "127.0.0.1"].some(h => window.location.hostname.includes(h))
    const myOrigin = window.location.origin
    const bridgeUrl = isLocal
      ? `http://localhost:5173/sso/bridge?origin=${encodeURIComponent(myOrigin)}`
      : `https://campussphere.app/sso/bridge?origin=${encodeURIComponent(myOrigin)}`

    let settled = false

    const iframe = document.createElement("iframe")
    iframe.src = bridgeUrl
    iframe.style.display = "none"

    const cleanup = () => {
      if (settled) return
      settled = true
      window.removeEventListener("message", handler)
      clearTimeout(timer)
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }

    const handler = (e: MessageEvent) => {
      if (!CS_ORIGINS.includes(e.origin)) return
      if (e.data?.type === "cs_sso" && e.data.access) {
        cleanup()
        resolve({ access: e.data.access, refresh: e.data.refresh || "" })
      } else if (e.data?.type === "cs_sso" || e.data?.type === "cs_sso_none") {
        cleanup()
        resolve(null)
      }
    }

    // Give the iframe max 3 seconds to respond, then give up silently.
    const timer = setTimeout(() => {
      cleanup()
      resolve(null)
    }, 3000)

    window.addEventListener("message", handler)
    document.body.appendChild(iframe)
  })
}

// ─── Provider ───────────────────────────────────────────────────
export const SpheraAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SpheraUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const boot = async () => {
      // 1. Check if we already have a Sphera token
      let token = getToken()

      // 2. If not, try silent SSO from CampusSphere
      if (!token) {
        try {
          const ssoResult = await attemptSilentSSO()
          if (ssoResult) {
            setTokens(ssoResult.access, ssoResult.refresh)
            token = ssoResult.access
          }
        } catch {
          // Silent SSO failed — no big deal, user can login manually
        }
      }

      // 3. If we have a token (either existing or from SSO), validate it
      if (token) {
        try {
          const u = await getCurrentUser()
          setUser(u)
        } catch {
          clearTokens()
          setUser(null)
        }
      }

      setIsLoading(false)
    }

    boot()
  }, [])

  const logout = () => {
    clearTokens()
    setUser(null)
  }

  return (
    <SpheraAuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, setUser, logout,
    }}>
      {children}
    </SpheraAuthContext.Provider>
  )
}

export const useSpheraAuth = () => {
  const ctx = useContext(SpheraAuthContext)
  if (!ctx) throw new Error('useSpheraAuth must be used within SpheraAuthProvider')
  return ctx
}
