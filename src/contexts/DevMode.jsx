import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const EMPTY = { active: false, email: '', coupleId: null, coupleInfo: null, pinSession: false, pin: '' }

const DevModeContext = createContext({
  ...EMPTY,
  setDev:      async () => ({ error: 'not ready' }),
  setDevByPin: async () => ({ error: 'not ready' }),
  clearDev:    () => {},
})

export function DevModeProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem('devMode')
      return s ? { ...EMPTY, ...JSON.parse(s) } : EMPTY
    } catch {
      return EMPTY
    }
  })

  // Email-based impersonation (admin dev tool)
  async function setDev(email) {
    const { data: user } = await supabase
      .from('users')
      .select('id, couple_id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!user) return { error: 'player_not_found' }
    if (!user.couple_id) return { error: 'couple_not_found' }

    const { data: couple } = await supabase
      .from('couples')
      .select('id, team_name, division, group_code')
      .eq('id', user.couple_id)
      .single()

    if (!couple) return { error: 'couple_not_found' }

    const next = { active: true, email: email.toLowerCase().trim(), coupleId: couple.id, coupleInfo: couple, pinSession: false, pin: '' }
    localStorage.setItem('devMode', JSON.stringify(next))
    setState(next)
    return {}
  }

  // PIN-based session (for players without @rubatec.cat)
  async function setDevByPin(pin) {
    const normalized = pin.toUpperCase().trim()
    if (!normalized) return { error: 'pin_empty' }

    const { data, error } = await supabase.rpc('couple_by_pin', { p_pin: normalized })

    if (error) return { error: 'pin_not_found' }
    if (!data?.length) return { error: 'pin_not_found' }

    const couple = data[0]
    const next = {
      active:     true,
      email:      '',
      coupleId:   couple.couple_id,
      coupleInfo: { id: couple.couple_id, team_name: couple.team_name, division: couple.division, group_code: couple.group_code },
      pinSession: true,
      pin:        normalized,
    }
    localStorage.setItem('devMode', JSON.stringify(next))
    setState(next)
    return {}
  }

  function clearDev() {
    localStorage.removeItem('devMode')
    setState(EMPTY)
  }

  return (
    <DevModeContext.Provider value={{ ...state, setDev, setDevByPin, clearDev }}>
      {children}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  return useContext(DevModeContext)
}
