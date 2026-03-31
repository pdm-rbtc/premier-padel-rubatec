import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useMatches(filters = {}) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let query = supabase
      .from('matches')
      .select('*, couple_a:couple_a_id(*), couple_b:couple_b_id(*)')

    if (filters.division)   query = query.eq('division', filters.division)
    if (filters.phase)      query = query.eq('phase', filters.phase)
    if (filters.group_code) query = query.eq('group_code', filters.group_code)
    if (filters.status)     query = query.eq('status', filters.status)

    // Filter to matches involving a specific couple (player portal)
    if (filters.coupleId) {
      query = query.or(`couple_a_id.eq.${filters.coupleId},couple_b_id.eq.${filters.coupleId}`)
    }

    query.order('scheduled_at').then(({ data, error }) => {
      if (error) setError(error)
      else setMatches(data ?? [])
      setLoading(false)
    })
  }, [filters.division, filters.phase, filters.group_code, filters.status, filters.coupleId])

  return { matches, loading, error, setMatches }
}
