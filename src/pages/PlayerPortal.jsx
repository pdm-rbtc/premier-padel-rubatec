import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { signInWithGoogle, signOut } from '../lib/auth.js'
import { useMatches } from '../hooks/useMatches.js'
import ScoreInput from '../components/ScoreInput.jsx'
import LiveBadge from '../components/LiveBadge.jsx'
import { formatName } from '../lib/utils.js'
import { t } from '../i18n/index.js'

const STATUS_LABEL = {
  scheduled:            { text: 'Pendiente',           bg: 'bg-gray-100',    color: 'text-gray-500' },
  pending_confirmation: { text: 'Pend. confirmación',  bg: 'bg-yellow-100',  color: 'text-yellow-700' },
  confirmed:            { text: 'Confirmado',           bg: 'bg-green-100',   color: 'text-green-700' },
  disputed:             { text: 'En disputa',           bg: 'bg-red-100',     color: 'text-red-600' },
}

// ── Login gate ────────────────────────────────────────────────────────────────
export default function PlayerPortal() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <div className="max-w-sm mx-auto text-center py-20 space-y-6">
        <div className="text-5xl">🎾</div>
        <div>
          <h1 className="text-xl font-bold text-primary">Mi Portal</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Inicia sesión con tu cuenta <span className="font-medium">@rubatec.cat</span> para ver tus partidos.
          </p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-text-primary px-5 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-shadow"
        >
          <GoogleIcon />
          Iniciar sesión con Google
        </button>
      </div>
    )
  }

  return <AuthenticatedPortal />
}

// ── Authenticated portal ──────────────────────────────────────────────────────
function AuthenticatedPortal() {
  const { user, profile, coupleId, loading: authLoading } = useAuth()
  const { matches, loading: matchLoading, setMatches, connected } = useMatches(
    coupleId ? { coupleId } : {}
  )
  const [expandedMatchId, setExpandedMatchId] = useState(null)

  const isLoading = authLoading || matchLoading

  // Sort: active first, then by scheduled_at
  const STATUS_ORDER = { pending_confirmation: 0, disputed: 1, scheduled: 2, confirmed: 3 }
  const sorted = [...matches].sort((a, b) => {
    const sd = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
    if (sd !== 0) return sd
    return new Date(a.scheduled_at) - new Date(b.scheduled_at)
  })

  const nextMatch = sorted.find(m => m.status === 'scheduled')

  // Called after score submission — update match in local state
  function handleScoreSubmitted(matchId) {
    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'pending_confirmation' } : m
    ))
    setExpandedMatchId(null)
  }

  // Called after confirmation/dispute — update match in local state
  async function handleConfirm(matchId) {
    const { error } = await supabase.from('matches').update({ status: 'confirmed' }).eq('id', matchId)
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'confirmed' } : m))
  }

  async function handleDispute(matchId) {
    const { error } = await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'disputed' } : m))
  }

  const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Profile header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt=""
              className="w-10 h-10 rounded-full border border-gray-100" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-text-primary leading-tight">{displayName}</div>
            <div className="text-xs text-text-secondary">{user?.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge connected={connected} />
          <button onClick={signOut} className="text-xs text-text-secondary hover:text-red-500 transition-colors">
            Salir
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-10 text-text-secondary text-sm">Cargando…</div>
      )}

      {!isLoading && !coupleId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Tu cuenta aún no está vinculada a ninguna pareja. Contacta con el administrador del torneo.
        </div>
      )}

      {!isLoading && coupleId && (
        <>
          {/* Next match hero */}
          {nextMatch && (
            <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white">
              <p className="text-xs font-semibold text-accent/90 uppercase tracking-widest mb-2">
                Próximo partido
              </p>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-bold text-lg leading-tight truncate">
                  {nextMatch.couple_a?.team_name}
                </span>
                <span className="text-white/50 text-sm shrink-0">vs</span>
                <span className="font-bold text-lg leading-tight truncate text-right">
                  {nextMatch.couple_b?.team_name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                {nextMatch.time_slot && <span>{nextMatch.time_slot}</span>}
                {nextMatch.court && <span>· {nextMatch.court}</span>}
              </div>
            </div>
          )}

          {/* Match list */}
          {matches.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-8">
              {t('portal.no_matches')}
            </p>
          ) : (
            <div className="space-y-3">
              {sorted.map(match => (
                <MatchRow
                  key={match.id}
                  match={match}
                  coupleId={coupleId}
                  expanded={expandedMatchId === match.id}
                  onToggleExpand={() => setExpandedMatchId(
                    expandedMatchId === match.id ? null : match.id
                  )}
                  onScoreSubmitted={() => handleScoreSubmitted(match.id)}
                  onConfirm={() => handleConfirm(match.id)}
                  onDispute={() => handleDispute(match.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Individual match row ──────────────────────────────────────────────────────
function MatchRow({ match, coupleId, expanded, onToggleExpand, onScoreSubmitted, onConfirm, onDispute }) {
  const sl = STATUS_LABEL[match.status] ?? STATUS_LABEL.scheduled
  const isSubmitter = match.submitted_by === coupleId
  const isParticipant = match.couple_a_id === coupleId || match.couple_b_id === coupleId
  const canSubmit   = match.status === 'scheduled' && isParticipant
  const canConfirm  = match.status === 'pending_confirmation' && isParticipant && !isSubmitter

  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Summary row */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>
              {sl.text}
            </span>
            {match.time_slot && (
              <span className="text-xs text-text-secondary">{match.time_slot}</span>
            )}
            {match.court && (
              <span className="text-xs text-text-secondary">· {match.court}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-semibold truncate ${match.couple_a_id === coupleId ? 'text-primary' : 'text-text-primary'}`}>
              {formatName(match.couple_a?.team_name, 16)}
            </span>
            <span className="text-text-secondary shrink-0">vs</span>
            <span className={`font-semibold truncate ${match.couple_b_id === coupleId ? 'text-primary' : 'text-text-primary'}`}>
              {formatName(match.couple_b?.team_name, 16)}
            </span>
          </div>
          {match.score_a && (
            <div className="mt-1 text-sm font-mono text-primary font-bold">
              {match.score_a} — {match.score_b}
            </div>
          )}
        </div>
        <span className="text-text-secondary text-lg mt-0.5">{expanded ? '↑' : '↓'}</span>
      </button>

      {/* Expanded actions */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50/30">
          {canSubmit && (
            <ScoreInput match={match} onSuccess={onScoreSubmitted} />
          )}

          {canConfirm && (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary mb-3">
                <span className="font-medium">{match.couple_a_id === match.submitted_by
                  ? match.couple_a?.team_name : match.couple_b?.team_name}</span> ha enviado el resultado:
                <span className="font-mono font-bold text-primary ml-2">
                  {match.score_a} — {match.score_b}
                </span>
              </p>
              <button onClick={onConfirm}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                Confirmar resultado
              </button>
              <button onClick={onDispute}
                className="w-full bg-white border border-red-200 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
                Disputar resultado
              </button>
            </div>
          )}

          {match.status === 'pending_confirmation' && isSubmitter && (
            <p className="text-sm text-text-secondary text-center py-2">
              Esperando confirmación del rival…
            </p>
          )}

          {match.status === 'disputed' && (
            <p className="text-sm text-red-600 text-center py-2">
              Resultado en disputa. El administrador resolverá este partido.
            </p>
          )}

          {match.status === 'confirmed' && (
            <p className="text-sm text-green-700 text-center py-2 font-medium">
              Resultado confirmado.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}
