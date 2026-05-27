import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, clearTokens, getToken } from '../services/spheraApi'

interface SpheraUser {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  avatar?: string | null
}

interface SpheraAuthContextType {
  user: SpheraUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (u: SpheraUser | null) => void
  logout: () => void
}

const SpheraAuthContext = createContext<SpheraAuthContextType | undefined>(undefined)

export const SpheraAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SpheraUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setIsLoading(false); return }

    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => { clearTokens(); setUser(null) })
      .finally(() => setIsLoading(false))
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
