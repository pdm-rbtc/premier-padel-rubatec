import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { isValidScore } from '../lib/scoring.js'
import { useAuth } from '../hooks/useAuth.js'
import { t } from '../i18n/index.js'

export default function ScoreInput({ match, onSuccess }) {
  const { user } = useAuth()
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fullScore = `${scoreA} ${scoreB}`.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isValidScore(scoreA) || !isValidScore(scoreB)) {
      setError('Formato inválido. Ejemplo: 6-4')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('matches').update({
      score_a: scoreA,
      score_b: scoreB,
      status: 'pending_confirmation',
      submitted_by: user?.user_metadata?.couple_id,
    }).eq('id', match.id)

    setSubmitting(false)
    if (error) setError(error.message)
    else onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="6-4"
          value={scoreA}
          onChange={e => setScoreA(e.target.value)}
          className="w-24 border rounded-lg px-3 py-2 text-center font-mono text-lg"
        />
        <span className="text-text-secondary">–</span>
        <input
          type="text"
          placeholder="4-6"
          value={scoreB}
          onChange={e => setScoreB(e.target.value)}
          className="w-24 border rounded-lg px-3 py-2 text-center font-mono text-lg"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-base hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : t('match.submit_score')}
      </button>
    </form>
  )
}
