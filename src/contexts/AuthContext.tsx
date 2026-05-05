import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'user' | null

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

async function fetchRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (error || !data) return 'user'
    return (data.role as UserRole) || 'user'
  } catch {
    return 'user'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const initialised = useRef(false)

  useEffect(() => {
    let mounted = true

    // getSession() is the single source of truth for the initial load.
    // It waits for any in-progress token refresh before resolving, so it
    // always returns the correct final session on page load/refresh.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const r = await fetchRole(session.user.id)
        if (mounted) setRole(r)
      }
      if (mounted) {
        setLoading(false)
        initialised.current = true
      }
    })

    // onAuthStateChange handles changes AFTER the initial load:
    // sign in, sign out, token refresh, password recovery, etc.
    // It must NOT touch `loading` — that would race with getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      // Skip the INITIAL_SESSION echo — getSession() already handled it.
      // Only process events once the initial load is confirmed.
      if (!initialised.current) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        const r = await fetchRole(session.user.id)
        if (mounted) setRole(r)
      } else {
        setRole(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
