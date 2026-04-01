import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

// Subscribes to postgres_changes on a table.
// filter: optional Supabase filter string, e.g. "division=eq.diamant"
// Returns { connected: bool }
//
// Each hook instance uses a stable unique ID so multiple components can
// subscribe to the same table/filter without colliding on the channel name.
export function useRealtime(table, onUpdate, filter = null) {
  const [connected, setConnected] = useState(false)
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const instanceId = useRef(`${table}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    const channelName = filter
      ? `${instanceId.current}:${filter}`
      : instanceId.current
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
