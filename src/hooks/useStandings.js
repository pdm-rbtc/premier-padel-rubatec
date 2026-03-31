import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useStandings(division, groupCode) {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!division || !groupCode) return

    supabase
      .from('group_standings')
      .select('*, couple:couple_id(*)')
      .eq('division', division)
      .eq('group_code', groupCode)
      .order('rank')
      .then(({ data, error }) => {
        if (error) setError(error)
        else setStandings(data ?? [])
        setLoading(false)
      })
  }, [division, groupCode])

  return { standings, loading, error }
}
