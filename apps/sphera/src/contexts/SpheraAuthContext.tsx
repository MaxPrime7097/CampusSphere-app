import React, { createContext, useContext, useEffect, useState } from 'react'
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
  const [user, setUser] = useState<SpheraUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
