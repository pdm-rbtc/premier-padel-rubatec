import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { useDevMode } from '../contexts/DevMode.jsx'

export default function ScoreInput({ match, onSuccess }) {
  const { coupleId } = useAuth()
  const devMode = useDevMode()
  const isPinSession = devMode.active && devMode.pinSession

  const [gA, setGA] = useState('')
  const [gB, setGB] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const nameA = match.couple_a?.team_name ?? 'Pareja A'
  const nameB = match.couple_b?.team_name ?? 'Pareja B'

  async function handleSubmit(e) {
    e.preventDefault()
    const a = parseInt(gA), b = parseInt(gB)
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      setError('Introduce el resultado correctamente.')
      return
    }
    if (a === b) {
      setError('El resultado no puede ser empate.')
      return
    }

    setSubmitting(true)
    setError(null)

    let dbError
    const isEmailSession = devMode.active && !devMode.pinSession
    if (isPinSession) {
      const res = await supabase.rpc('submit_score_pin', {
        p_match_id: match.id,
        p_pin:      devMode.pin,
        p_games_a:  a,
        p_games_b:  b,
      })
      dbError = res.error
    } else if (isEmailSession) {
      const res = await supabase.rpc('submit_score_couple_id', {
        p_match_id:  match.id,
        p_couple_id: coupleId,
        p_games_a:   a,
        p_games_b:   b,
      })
      dbError = res.error
    } else {
      const res = await supabase
        .from('matches')
        .update({
          score_a:      `${a}-${b}`,
          score_b:      `${b}-${a}`,
          games_a:      a,
          games_b:      b,
          status:       'pending_confirmation',
          submitted_by: coupleId,
        })
        .eq('id', match.id)
      dbError = res.error
    }

    setSubmitting(false)
    if (dbError) setError(dbError.message)
    else onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        {/* Team A */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nameA}
          </div>
          <input
            type="number" min="0" max="99"
            value={gA}
            onChange={e => setGA(e.target.value)}
            placeholder="0"
            style={{
              width: '100%', height: 56, textAlign: 'center',
              fontSize: 28, fontWeight: 700,
              border: '2px solid #e2e8f0', borderRadius: 12,
              outline: 'none', fontFamily: 'DM Mono, monospace',
              color: '#0032a0',
            }}
          />
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginTop: 22 }}>—</div>

        {/* Team B */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nameB}
          </div>
          <input
            type="number" min="0" max="99"
            value={gB}
            onChange={e => setGB(e.target.value)}
            placeholder="0"
            style={{
              width: '100%', height: 56, textAlign: 'center',
              fontSize: 28, fontWeight: 700,
              border: '2px solid #e2e8f0', borderRadius: 12,
              outline: 'none', fontFamily: 'DM Mono, monospace',
              color: '#0032a0',
            }}
          />
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{error}</p>}

      <button type="submit" disabled={submitting} style={{
        width: '100%', background: '#0032a0', color: 'white',
        border: 'none', borderRadius: 12, padding: '14px 0',
        fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
        opacity: submitting ? 0.6 : 1,
      }}>
        {submitting ? 'Enviando…' : 'Enviar resultado'}
      </button>
    </form>
  )
}
