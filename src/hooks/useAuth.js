import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { isAdmin, isAdminEmail } from '../lib/auth.js'
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
      .then(async ({ data }) => {
        // If we already have a couple linked, we're done
        if (data?.couple_id) { setProfile(data); return }

        // Row exists but couple_id is null, OR first login — try to auto-link via email.
        // Path A: players table → FK on couples
        // Path B: player_1_email / player_2_email directly on couples (CSV-imported)
        const email = user.email?.toLowerCase()
        let coupleId = null

        const { data: player } = await supabase
          .from('players')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (player?.id) {
          const { data: c } = await supabase
            .from('couples')
            .select('id')
            .or(`player_1_id.eq.${player.id},player_2_id.eq.${player.id}`)
            .maybeSingle()
          coupleId = c?.id ?? null
        }

        if (!coupleId) {
          const { data: c } = await supabase
            .from('couples')
            .select('id')
            .or(`player_1_email.eq.${email},player_2_email.eq.${email}`)
            .maybeSingle()
          coupleId = c?.id ?? null
        }

        if (data) {
          // Row exists but couple_id was null — update it if we found a link
          if (coupleId) {
            const { data: updated } = await supabase
              .from('users')
              .update({ couple_id: coupleId })
              .eq('id', user.id)
              .select('couple_id, role, display_name, avatar_url')
              .single()
            setProfile(updated ?? { ...data, couple_id: coupleId })
          } else {
            setProfile(data)
          }
          return
        }

        // First login — insert row
        const newRow = {
          id:           user.id,
          email:        user.email,
          display_name: user.user_metadata?.full_name ?? user.email,
          avatar_url:   user.user_metadata?.avatar_url ?? null,
          role:         'player',
          couple_id:    coupleId,
        }
        const { data: inserted } = await supabase
          .from('users')
          .upsert(newRow, { onConflict: 'id' })
          .select('couple_id, role, display_name, avatar_url')
          .single()
        setProfile(inserted ?? newRow)
      })
  }, [user?.id])

  const coupleId = devMode.active ? devMode.coupleId : (profile?.couple_id ?? null)

  // Admin via real Supabase session OR via email-typed devMode session
  const adminStatus = isAdmin(user) || (devMode.active && !devMode.pinSession && isAdminEmail(devMode.email))

  return {
    user,
    profile,
    loading,
    coupleId,
    isAdmin: adminStatus,
    devMode,
  }
}
