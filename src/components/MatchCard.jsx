import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'

export default function MatchCard({ match }) {
  const { t } = useI18n()
  const statusColors = {
    scheduled: 'bg-gray-100 text-gray-600',
    pending_confirmation: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    disputed: 'bg-red-100 text-red-700',
    bye: 'bg-gray-100 text-gray-500',
    walkover: 'bg-gray-100 text-gray-500',
  }

  const statusClass = statusColors[match.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <Link to={`/match/${match.id}`} className="block bg-surface rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-secondary">{match.time_slot} · {match.court}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
          {t(`match.status.${match.status}`)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm truncate">{match.couple_a?.team_name ?? '—'}</span>
        <span className="text-text-secondary text-xs shrink-0">{t('match.vs')}</span>
        <span className="font-semibold text-sm truncate text-right">{match.couple_b?.team_name ?? '—'}</span>
      </div>
      {match.score_a && (
        <div className="mt-2 text-center text-sm font-mono text-primary">
          {match.score_a} / {match.score_b}
        </div>
      )}
    </Link>
  )
}
