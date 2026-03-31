import { useAuth } from '../hooks/useAuth.js'
import { signInWithGoogle } from '../lib/auth.js'
import { useMatches } from '../hooks/useMatches.js'
import MatchCard from '../components/MatchCard.jsx'
import { t } from '../i18n/index.js'

export default function PlayerPortal() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-text-secondary">Inicia sesión para ver tus partidos.</p>
        <button onClick={signInWithGoogle} className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90">
          {t('nav.login')} con Google
        </button>
      </div>
    )
  }

  return <AuthenticatedPortal user={user} />
}

function AuthenticatedPortal({ user }) {
  const coupleId = user?.user_metadata?.couple_id
  const { matches, loading } = useMatches({})

  const myMatches = matches.filter(m =>
    m.couple_a_id === coupleId || m.couple_b_id === coupleId
  )

  const nextMatch = myMatches.find(m => m.status === 'scheduled')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">{t('portal.my_matches')}</h1>
      {nextMatch && (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 text-white">
          <div className="text-sm font-medium text-accent mb-2">{t('portal.next_match')}</div>
          <div className="font-bold">{nextMatch.time_slot} · {nextMatch.court}</div>
          <div className="mt-1">{nextMatch.couple_a?.team_name} vs {nextMatch.couple_b?.team_name}</div>
        </div>
      )}
      {loading ? (
        <p className="text-text-secondary">Cargando...</p>
      ) : myMatches.length === 0 ? (
        <p className="text-text-secondary">{t('portal.no_matches')}</p>
      ) : (
        <div className="space-y-3">
          {myMatches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}
