import { useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

export function useRealtime(table, onUpdate) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onUpdate)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [table])
}
