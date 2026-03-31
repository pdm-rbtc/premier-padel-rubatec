import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useRealtime } from './useRealtime.js'

export function useBracket(division) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading]  = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!division) return
    setLoading(true)
    supabase
      .from('matches')
      .select('*, couple_a:couple_a_id(id, team_name), couple_b:couple_b_id(id, team_name)')
      .eq('division', division)
      .eq('phase', 'knockout')
      .order('position')
      .then(({ data }) => {
        setMatches(data ?? [])
        setLoading(false)
      })
  }, [division, refreshKey])

  const { connected } = useRealtime(
    'matches',
    () => setRefreshKey(k => k + 1),
    division ? `division=eq.${division}` : null,
  )

  return { matches, loading, connected }
}
