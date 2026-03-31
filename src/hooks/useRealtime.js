import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

// Subscribes to postgres_changes on a table.
// filter: optional Supabase filter string, e.g. "division=eq.diamant"
// Returns { connected: bool }
export function useRealtime(table, onUpdate, filter = null) {
  const [connected, setConnected] = useState(false)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate

  useEffect(() => {
    const channelName = filter ? `realtime:${table}:${filter}` : `realtime:${table}`
    const config = { event: '*', schema: 'public', table }
    if (filter) config.filter = filter

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', config, payload => onUpdateRef.current(payload))
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
      setConnected(false)
    }
  }, [table, filter])

  return { connected }
}
