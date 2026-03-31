import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { isAdmin } from '../lib/auth.js'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)   // { couple_id, role } from public.users
  const [loading, setLoading] = useState(true)

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

  // Fetch profile (couple_id, role) whenever the authenticated user changes
  useEffect(() => {
    if (!user) { setProfile(null); return }

    supabase
      .from('users')
      .select('couple_id, role, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
  }, [user?.id])

  return {
    user,
    profile,
    loading,
    coupleId: profile?.couple_id ?? null,
    isAdmin: isAdmin(user),
  }
}
