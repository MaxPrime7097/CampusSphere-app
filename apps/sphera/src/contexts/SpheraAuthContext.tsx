import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { getCurrentUser, clearTokens, getToken, setTokens } from '../services/spheraApi'
import { attemptSilentSso } from '@cs/sso'

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

// ─── Provider ───────────────────────────────────────────────────
export const SpheraAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<SpheraUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Track whether a concurrent setUser() call (from SSOCatcher or Login) has
  // already set the user so boot() doesn't overwrite with null on error.
  const userSetExternallyRef = useRef(false)

  const setUser = (u: SpheraUser | null) => {
    userSetExternallyRef.current = true
    setUserState(u)
  }

  useEffect(() => {
    const boot = async () => {
      // 1. Check if we already have a Sphera token
      let token = getToken()

      // 2. If not, try silent SSO from CampusSphere
      if (!token) {
        try {
          const ssoResult = await attemptSilentSso()
          if (ssoResult) {
            setTokens(ssoResult.access, ssoResult.refresh)
            token = ssoResult.access
          }
        } catch {
          // Silent SSO failed — no big deal, user can login manually
        }
      }

      // Bail out early if a concurrent login (SSOCatcher or Login page) already
      // set the user while we were doing the async SSO probe above.
      if (userSetExternallyRef.current) {
        setIsLoading(false)
        return
      }

      // 3. If we have a token (either existing or from SSO), validate it
      if (token) {
        try {
          const u = await getCurrentUser()
          // Check again: a concurrent login might have completed while we awaited.
          if (!userSetExternallyRef.current) {
            setUserState(u)
          }
        } catch (err: any) {
          // Only clear tokens on genuine authentication errors (401 / 403).
          // Network errors, timeouts, server 5xx, etc. must NOT log the user out —
          // that is what causes the random ejections reported by users.
          const isAuthError = err?.message &&
            (err.message.includes("session") ||
             err.message.includes("expiré") ||
             err.message.includes("expired") ||
             err.message.includes("invalid") ||
             err.message.includes("invalide") ||
             err.message.includes("reconnect"))
          if (isAuthError) {
            clearTokens()
            if (!userSetExternallyRef.current) setUserState(null)
          }
          // If it's a network/server error, keep the user logged in — they'll
          // get a proper 401 on their next request and the interceptor will retry.
        }
      }

      setIsLoading(false)
    }

    boot()
  }, [])

  const logout = () => {
    clearTokens()
    setUserState(null)
    userSetExternallyRef.current = false
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
