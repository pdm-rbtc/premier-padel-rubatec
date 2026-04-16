import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { isAdminEmail } from '../lib/auth.js'

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
  // Works for @rubatec.cat users (have a users row) AND external players (matched via couple emails)
  async function setDev(email) {
    const normalizedEmail = email.toLowerCase().trim()
    let couple = null

    // Path A: user has logged in → check users table for couple_id
    const { data: user } = await supabase
      .from('users')
      .select('id, couple_id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (user?.couple_id) {
      const { data: c } = await supabase
        .from('couples')
        .select('id, team_name, division, group_code')
        .eq('id', user.couple_id)
        .maybeSingle()
      couple = c ?? null
    }

    // Path B: no users row (external player) → look up via couple email columns
    if (!couple) {
      const { data: c } = await supabase
        .from('couples')
        .select('id, team_name, division, group_code')
        .or(`player_1_email.eq.${normalizedEmail},player_2_email.eq.${normalizedEmail}`)
        .maybeSingle()
      couple = c ?? null
    }

    // Admin emails have no couple — allow them through so they get admin access
    if (!couple && !isAdminEmail(normalizedEmail)) return { error: 'couple_not_found' }

    const next = { active: true, email: normalizedEmail, coupleId: couple?.id ?? null, coupleInfo: couple ?? null, pinSession: false, pin: '' }
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
