import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useRealtime } from './useRealtime.js'

export function useStandings(division, groupCode) {
  const [standings, setStandings] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!division || !groupCode) return

    supabase
      .from('group_standings')
      .select('*, couple:couple_id(*)')
      .eq('division', division)
      .eq('group_code', groupCode)
      .order('rank', { nullsFirst: false })
      .order('points', { ascending: false })
      .order('game_differential', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error)
        else setStandings(data ?? [])
        setLoading(false)
      })
  }, [division, groupCode, refreshKey])

  // Re-fetch when any standing in this division changes
  useRealtime(
    'group_standings',
    () => setRefreshKey(k => k + 1),
    division ? `division=eq.${division}` : null,
  )

  return { standings, loading, error }
}
