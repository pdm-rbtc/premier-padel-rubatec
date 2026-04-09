import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { isAdmin } from '../lib/auth.js'
import { useDevMode } from '../contexts/DevMode.jsx'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const devMode = useDevMode()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setProfile(null); return }

    supabase
      .from('users')
      .select('couple_id, role, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
  }, [user?.id])

  // Dev mode overrides coupleId for portal testing; real auth (isAdmin) always uses real user
  const coupleId = devMode.active ? devMode.coupleId : (profile?.couple_id ?? null)

  return {
    user,
    profile,
    loading,
    coupleId,
    isAdmin: isAdmin(user),
    devMode,
  }
}
