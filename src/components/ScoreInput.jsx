import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'

// Each set is { a: string, b: string } (strings so inputs can be empty)
function emptySet() { return { a: '', b: '' } }

function SetRow({ index, set, onChange, onRemove, canRemove }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-12 shrink-0 text-right">Set {index + 1}</span>
      <input
        type="number" min="0" max="99"
        value={set.a}
        onChange={e => onChange(index, 'a', e.target.value)}
        placeholder="0"
        className="w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
      />
      <span className="text-text-secondary font-bold">—</span>
      <input
        type="number" min="0" max="99"
        value={set.b}
        onChange={e => onChange(index, 'b', e.target.value)}
        placeholder="0"
        className="w-16 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
      />
      {canRemove && (
        <button type="button" onClick={() => onRemove(index)}
          className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none ml-1">
          ×
        </button>
      )}
    </div>
  )
}

export default function ScoreInput({ match, onSuccess }) {
  const { coupleId } = useAuth()
  const [sets, setSets] = useState([emptySet()])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const nameA = match.couple_a?.team_name ?? 'Pareja A'
  const nameB = match.couple_b?.team_name ?? 'Pareja B'

  function updateSet(index, side, value) {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [side]: value } : s))
  }
  function addSet() { if (sets.length < 3) setSets(prev => [...prev, emptySet()]) }
  function removeSet(index) { setSets(prev => prev.filter((_, i) => i !== index)) }

  function validate() {
    for (const s of sets) {
      const a = parseInt(s.a), b = parseInt(s.b)
      if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return 'Rellena todos los sets correctamente.'
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    const gamesA = sets.reduce((sum, s) => sum + parseInt(s.a), 0)
    const gamesB = sets.reduce((sum, s) => sum + parseInt(s.b), 0)
    const scoreA = sets.map(s => `${s.a}-${s.b}`).join(' ')
    const scoreB = sets.map(s => `${s.b}-${s.a}`).join(' ')

    setSubmitting(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('matches')
      .update({
        score_a: scoreA,
        score_b: scoreB,
        games_a: gamesA,
        games_b: gamesB,
        status: 'pending_confirmation',
        submitted_by: coupleId,
      })
      .eq('id', match.id)

    setSubmitting(false)
    if (dbError) setError(dbError.message)
    else onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Column headers */}
      <div className="flex items-center gap-3 text-xs font-medium text-text-secondary mb-1">
        <span className="w-12 shrink-0" />
        <span className="w-16 text-center truncate">{nameA}</span>
        <span className="w-4" />
        <span className="w-16 text-center truncate">{nameB}</span>
      </div>

      <div className="space-y-3">
        {sets.map((set, i) => (
          <SetRow key={i} index={i} set={set} onChange={updateSet}
            onRemove={removeSet} canRemove={sets.length > 1} />
        ))}
      </div>

      {sets.length < 3 && (
        <button type="button" onClick={addSet}
          className="text-sm text-primary/60 hover:text-primary transition-colors">
          + Añadir set
        </button>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-base hover:opacity-90 disabled:opacity-50 transition-opacity">
        {submitting ? 'Enviando…' : 'Enviar resultado'}
      </button>
    </form>
  )
}
