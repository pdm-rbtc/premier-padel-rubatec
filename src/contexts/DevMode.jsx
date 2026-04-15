import { createContext, useContext, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const DevModeContext = createContext({
  active: false,
  email: '',
  coupleId: null,
  coupleInfo: null,
  setDev: async () => ({ error: 'not ready' }),
  clearDev: () => {},
})

export function DevModeProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem('devMode')
      return s ? JSON.parse(s) : { active: false, email: '', coupleId: null, coupleInfo: null }
    } catch {
      return { active: false, email: '', coupleId: null, coupleInfo: null }
    }
  })

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

    const next = { active: true, email: email.toLowerCase().trim(), coupleId: couple.id, coupleInfo: couple }
    localStorage.setItem('devMode', JSON.stringify(next))
    setState(next)
    return {}
  }

  function clearDev() {
    localStorage.removeItem('devMode')
    setState({ active: false, email: '', coupleId: null, coupleInfo: null })
  }

  return (
    <DevModeContext.Provider value={{ ...state, setDev, clearDev }}>
      {children}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  return useContext(DevModeContext)
}
