import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import ScoreInput from '../components/ScoreInput.jsx'
import { useI18n } from '../i18n/index.jsx'

export default function MatchDetail() {
  const { t } = useI18n()
  const { id } = useParams()
  const { user } = useAuth()
  const [match, setMatch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('matches')
      .select('*, couple_a:couple_a_id(*), couple_b:couple_b_id(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setMatch(data); setLoading(false) })
  }, [id])

  if (loading) return <div className="text-center py-10 text-text-secondary">Cargando...</div>
  if (!match) return <div className="text-center py-10">{t('errors.not_found')}</div>

  const userCoupleId = user?.user_metadata?.couple_id
  const canSubmit = match.status === 'scheduled' &&
    (userCoupleId === match.couple_a_id || userCoupleId === match.couple_b_id)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-xs text-text-secondary mb-1">{match.time_slot} · {match.court}</div>
        <div className="flex items-center justify-between gap-4 my-4">
          <div className="text-center flex-1">
            <div className="font-bold text-lg">{match.couple_a?.team_name}</div>
            <div className="text-sm text-text-secondary">{match.couple_a?.player_1_name} / {match.couple_a?.player_2_name}</div>
          </div>
          <div className="text-2xl font-bold text-text-secondary">VS</div>
          <div className="text-center flex-1">
            <div className="font-bold text-lg">{match.couple_b?.team_name}</div>
            <div className="text-sm text-text-secondary">{match.couple_b?.player_1_name} / {match.couple_b?.player_2_name}</div>
          </div>
        </div>
        {match.score_a && (
          <div className="text-center text-2xl font-mono font-bold text-primary">
            {match.score_a} — {match.score_b}
          </div>
        )}
      </div>
      {canSubmit && (
        <div className="bg-surface rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold mb-4">{t('match.submit_score')}</h2>
          <ScoreInput match={match} onSuccess={() => window.location.reload()} />
        </div>
      )}
    </div>
  )
}
