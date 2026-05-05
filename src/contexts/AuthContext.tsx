import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole = 'admin' | 'user' | null

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  loading: boolean
  refreshRole: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  refreshRole: async () => {},
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
  const userRef = useRef<User | null>(null)

  // Keep userRef in sync so the visibility handler can read it without stale closure
  useEffect(() => { userRef.current = user }, [user])

  // Manually re-fetch the role from DB — call this after changing a role
  const refreshRole = useCallback(async () => {
    const currentUser = userRef.current
    if (!currentUser) return
    const r = await fetchRole(currentUser.id)
    setRole(r)
  }, [])

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

    // Re-fetch the role whenever the tab becomes visible again.
    // This catches cases where the role was changed externally (e.g. Supabase
    // dashboard or admin panel) while the user was on another tab.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && userRef.current) {
        fetchRole(userRef.current.id).then(r => { if (mounted) setRole(r) })
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      mounted = false
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, refreshRole, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
