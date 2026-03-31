import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'
import { t } from '../../i18n/index.js'

export default function ManageMatches() {
  const { isAdmin } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('disputed')

  useEffect(() => {
    supabase.from('matches')
      .select('*, couple_a:couple_a_id(*), couple_b:couple_b_id(*)')
      .eq('status', filter)
      .order('scheduled_at')
      .then(({ data }) => { setMatches(data ?? []); setLoading(false) })
  }, [filter])

  if (!isAdmin) return <div className="text-center py-10 text-red-600">{t('errors.not_authorized')}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{t('admin.matches')}</h1>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="disputed">En disputa</option>
          <option value="pending_confirmation">Pendiente</option>
          <option value="scheduled">Programados</option>
          <option value="confirmed">Confirmados</option>
        </select>
      </div>
      {loading ? (
        <p className="text-text-secondary">Cargando...</p>
      ) : matches.length === 0 ? (
        <p className="text-text-secondary">No hay partidos en este estado.</p>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <div key={m.id} className="bg-surface border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{m.couple_a?.team_name} vs {m.couple_b?.team_name}</span>
                <span className="text-xs text-text-secondary">{m.time_slot} · {m.court}</span>
              </div>
              {m.score_a && <div className="mt-1 text-sm text-primary font-mono">{m.score_a} / {m.score_b}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
