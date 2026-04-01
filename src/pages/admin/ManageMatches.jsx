import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'
import AdminGuard from '../../components/AdminGuard.jsx'

const FILTERS = [
  { value: 'disputed',             label: 'En disputa',          color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'pending_confirmation', label: 'Pend. confirmación',  color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'scheduled',            label: 'Programados',         color: 'text-gray-600 bg-gray-50 border-gray-200' },
  { value: 'confirmed',            label: 'Confirmados',         color: 'text-green-700 bg-green-50 border-green-200' },
]

export default function ManageMatches() {
  return (
    <AdminGuard>
      <ManageMatchesContent />
    </AdminGuard>
  )
}

function ManageMatchesContent() {
  const { user } = useAuth()
  const [filter, setFilter]     = useState('disputed')
  const [matches, setMatches]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [resolving, setResolving] = useState(null)  // match id being resolved

  useEffect(() => {
    setLoading(true)
    supabase
      .from('matches')
      .select('*, couple_a:couple_a_id(*), couple_b:couple_b_id(*)')
      .eq('status', filter)
      .order('scheduled_at')
      .then(({ data }) => { setMatches(data ?? []); setLoading(false) })
  }, [filter])

  async function resolveDispute(matchId, winnerId, scoreA, scoreB) {
    setResolving(matchId)
    const parseGames = (score, side) =>
      score.split(' ').reduce((s, p) => s + (parseInt(p.split('-')[side] || 0) || 0), 0)
    const gamesA = parseGames(scoreA, 0)
    const gamesB = parseGames(scoreB, 1)

    const { error } = await supabase.rpc('admin_resolve_match', {
      p_match_id:  matchId,
      p_actor_id:  user.id,
      p_winner_id: winnerId,
      p_score_a:   scoreA,
      p_score_b:   scoreB,
      p_games_a:   gamesA,
      p_games_b:   gamesB,
    })

    setResolving(null)
    if (!error) setMatches(prev => prev.filter(m => m.id !== matchId))
  }

  async function adminConfirm(matchId) {
    setResolving(matchId)
    const { error } = await supabase.rpc('confirm_match', {
      p_match_id: matchId,
      p_actor_id: user.id,
    })
    setResolving(null)
    if (!error) setMatches(prev => prev.filter(m => m.id !== matchId))
  }

  const currentFilter = FILTERS.find(f => f.value === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-primary">Partidos</h1>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
                ${filter === f.value ? f.color : 'text-text-secondary bg-white border-gray-200 hover:border-gray-300'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary text-sm">Cargando…</p>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-text-secondary text-sm">
          No hay partidos en estado "{currentFilter?.label}".
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(m => (
            <MatchAdminRow
              key={m.id}
              match={m}
              filter={filter}
              resolving={resolving === m.id}
              onAdminConfirm={() => adminConfirm(m.id)}
              onResolveDispute={(winnerId, sa, sb) => resolveDispute(m.id, winnerId, sa, sb)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchAdminRow({ match, filter, resolving, onAdminConfirm, onResolveDispute }) {
  const [expanded, setExpanded] = useState(filter === 'disputed')
  const [overrideScore, setOverrideScore] = useState({
    score_a: match.score_a ?? '',
    score_b: match.score_b ?? '',
    winner:  match.winner_id ?? match.couple_a_id,
  })

  const nameA = match.couple_a?.team_name ?? 'Pareja A'
  const nameB = match.couple_b?.team_name ?? 'Pareja B'

  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {match.division && (
              <span className="text-xs text-text-secondary capitalize">{match.division}</span>
            )}
            {match.round && (
              <span className="text-xs text-text-secondary">· {match.round}</span>
            )}
            {match.time_slot && (
              <span className="text-xs text-text-secondary">· {match.time_slot}</span>
            )}
            {match.court && (
              <span className="text-xs text-text-secondary">· {match.court}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="truncate">{nameA}</span>
            <span className="text-text-secondary shrink-0 font-normal">vs</span>
            <span className="truncate">{nameB}</span>
          </div>
          {match.score_a && (
            <div className="text-xs font-mono text-primary mt-1">
              {match.score_a} — {match.score_b}
            </div>
          )}
        </div>
        <span className="text-text-secondary shrink-0">{expanded ? '↑' : '↓'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/30 space-y-4">

          {/* Pending confirmation — admin can just confirm */}
          {filter === 'pending_confirmation' && (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">
                Resultado enviado:
                <span className="font-mono font-bold text-primary ml-2">
                  {match.score_a} — {match.score_b}
                </span>
                <span className="ml-2 text-xs">(esperando confirmación del rival)</span>
              </p>
              <button
                onClick={onAdminConfirm}
                disabled={resolving}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {resolving ? 'Confirmando…' : 'Confirmar como admin'}
              </button>
            </div>
          )}

          {/* Disputed — admin override with editable score */}
          {filter === 'disputed' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-600">Resultado en disputa — introduce el resultado correcto:</p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Resultado (ej: 6-4 4-6 7-5)</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={overrideScore.score_a}
                    onChange={e => setOverrideScore(s => ({ ...s, score_a: e.target.value }))}
                    placeholder="6-4"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                  <span className="text-text-secondary">—</span>
                  <input
                    value={overrideScore.score_b}
                    onChange={e => setOverrideScore(s => ({ ...s, score_b: e.target.value }))}
                    placeholder="4-6"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">Ganador</label>
                <div className="flex gap-2">
                  {[
                    { id: match.couple_a_id, name: nameA },
                    { id: match.couple_b_id, name: nameB },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setOverrideScore(s => ({ ...s, winner: opt.id }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${overrideScore.winner === opt.id
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-text-primary border-gray-200 hover:border-primary/50'}`}
                    >
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onResolveDispute(overrideScore.winner, overrideScore.score_a, overrideScore.score_b)}
                disabled={resolving || !overrideScore.score_a || !overrideScore.score_b}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {resolving ? 'Guardando…' : 'Guardar resolución'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
