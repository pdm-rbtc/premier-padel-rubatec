import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { signInWithGoogle, signOut } from '../lib/auth.js'
import { useMatches } from '../hooks/useMatches.js'
import ScoreInput from '../components/ScoreInput.jsx'
import LiveBadge from '../components/LiveBadge.jsx'
import { formatName } from '../lib/utils.js'
import { useI18n } from '../i18n/index.jsx'

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_STYLE = {
  confirmed:            { bg: 'rgba(17,239,181,.12)',  color: '#0cb882', icon: '✓' },
  pending_confirmation: { bg: 'rgba(255,128,0,.10)',   color: '#ff8000', icon: '⏳' },
  scheduled:            { bg: 'rgba(100,116,139,.08)', color: '#94a3b8', icon: '·' },
  disputed:             { bg: 'rgba(239,68,68,.10)',   color: '#ef4444', icon: '⚠' },
}

function StatusBadge({ status }) {
  const { t } = useI18n()
  const cfg = STATUS_STYLE[status] ?? STATUS_STYLE.scheduled
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      fontSize: 9,
      fontWeight: 600,
      padding: '3px 7px',
      borderRadius: 20,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {t(`match.status.${status}`)}
    </span>
  )
}

// ── Login gate ────────────────────────────────────────────────────────────────
export default function PlayerPortal() {
  const { t } = useI18n()
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <div style={{ maxWidth: 380, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(0,29,114,.08)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h1 style={{ color: '#001d72', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{t('portal.login_title')}</h1>
          <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: '0 0 28px' }}>
            {t('portal.login_subtitle')}
          </p>
          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: 'white',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            }}
          >
            <GoogleIcon />
            {t('portal.login_google')}
          </button>
        </div>
      </div>
    )
  }

  return <AuthenticatedPortal />
}

// ── Authenticated portal ──────────────────────────────────────────────────────
function AuthenticatedPortal() {
  const { t } = useI18n()
  const { user, profile, coupleId, loading: authLoading } = useAuth()
  const { matches, loading: matchLoading, setMatches, connected } = useMatches(
    coupleId ? { coupleId } : {}
  )
  const [expandedMatchId, setExpandedMatchId] = useState(null)
  const [coupleInfo, setCoupleInfo] = useState(null)

  useEffect(() => {
    if (!coupleId) return
    supabase.from('couples').select('*').eq('id', coupleId).single()
      .then(({ data }) => { if (data) setCoupleInfo(data) })
  }, [coupleId])

  const isLoading = authLoading || matchLoading

  // Sort: active first, then by scheduled_at
  const STATUS_ORDER = { pending_confirmation: 0, disputed: 1, scheduled: 2, confirmed: 3 }
  const sorted = [...matches].sort((a, b) => {
    const sd = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
    if (sd !== 0) return sd
    return new Date(a.scheduled_at) - new Date(b.scheduled_at)
  })

  const nextMatch = sorted.find(m => m.status === 'scheduled')

  const wins   = matches.filter(m => m.winner_id === coupleId).length
  const losses = matches.filter(m => m.status === 'confirmed' && m.winner_id && m.winner_id !== coupleId).length
  const divLabel = coupleInfo
    ? `División ${coupleInfo.division?.charAt(0).toUpperCase()}${coupleInfo.division?.slice(1) ?? ''} · Grupo ${coupleInfo.group_code ?? '—'}`
    : null

  function handleScoreSubmitted(matchId) {
    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, status: 'pending_confirmation' } : m
    ))
    setExpandedMatchId(null)
  }

  async function handleConfirm(matchId) {
    const { error } = await supabase.rpc('confirm_match', {
      p_match_id: matchId,
      p_actor_id: user.id,
    })
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'confirmed' } : m))
  }

  async function handleDispute(matchId) {
    const { error } = await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)
    if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'disputed' } : m))
  }

  const displayName = profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* User info strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt=""
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e2e8f0' }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(0,29,114,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#001d72', fontWeight: 700, fontSize: 12,
            }}>
              {displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LiveBadge connected={connected} />
          <button onClick={signOut} style={{
            fontSize: 11, color: '#94a3b8', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 6px', borderRadius: 6,
          }}>
            {t('portal.logout')}
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>
          {t('portal.loading')}
        </div>
      )}

      {!isLoading && !coupleId && (
        <div style={{
          background: 'rgba(255,248,230,.8)',
          border: '1px solid rgba(255,128,0,.2)',
          borderRadius: 12,
          padding: '14px 16px',
          fontSize: 12,
          color: '#92400e',
          lineHeight: 1.5,
        }}>
          {t('portal.no_couple')}
        </div>
      )}

      {!isLoading && coupleId && (
        <>
          {/* MI PAREJA gradient card */}
          <div style={{
            background: 'linear-gradient(135deg,#001d72,#0433FF)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', top: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(17,239,181,.18) 0%,transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, letterSpacing: 1, fontWeight: 500, marginBottom: 6 }}>
                {t('portal.my_couple').toUpperCase()}
              </div>
              <div style={{ color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
                {coupleInfo?.team_name ?? displayName}
              </div>
              {(divLabel || wins + losses > 0) && (
                <div style={{ color: '#11efb5', fontSize: 11 }}>
                  {divLabel ?? ''}
                  {wins + losses > 0 && ` · ${wins}G ${losses}P`}
                </div>
              )}
            </div>
          </div>

          {/* PRÓXIMO PARTIDO */}
          {nextMatch && (
            <div style={{
              background: 'white',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,29,114,.05)',
            }}>
              <div style={{ padding: '10px 14px 0' }}>
                <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, letterSpacing: .5, marginBottom: 8 }}>
                  {t('portal.next_match').toUpperCase()}
                </div>
              </div>
              {/* Court + time + badge */}
              <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {nextMatch.court && <span style={{ color: '#11efb5', fontWeight: 600 }}>{nextMatch.court}</span>}
                  {nextMatch.court && nextMatch.time_slot && ' · '}
                  {nextMatch.time_slot && <span>{nextMatch.time_slot}</span>}
                </div>
                <StatusBadge status={nextMatch.status} />
              </div>
              {/* VS layout */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '0 14px 16px',
              }}>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  {nextMatch.couple_a_id === coupleId && (
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#11efb5', marginBottom: 2 }}>{t('portal.you')}</div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                    {nextMatch.couple_a?.team_name}
                  </div>
                </div>
                <div style={{
                  background: '#f1f5f9',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#64748b',
                  flexShrink: 0,
                }}>
                  VS
                </div>
                <div style={{ flex: 1 }}>
                  {nextMatch.couple_b_id === coupleId && (
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#11efb5', marginBottom: 2 }}>{t('portal.you')}</div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>
                    {nextMatch.couple_b?.team_name}
                  </div>
                </div>
              </div>
              {/* Submit button */}
              <div style={{ padding: '0 14px 14px' }}>
                <button
                  onClick={() => setExpandedMatchId(
                    expandedMatchId === nextMatch.id ? null : nextMatch.id
                  )}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg,#11efb5,#0cb882)',
                    color: '#001d72',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 12,
                    border: 'none',
                    padding: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(17,239,181,.25)',
                  }}
                >
                  {expandedMatchId === nextMatch.id ? t('portal.cancel') : `🎾 ${t('portal.send_result')}`}
                </button>
                {expandedMatchId === nextMatch.id && (
                  <div style={{ marginTop: 10 }}>
                    <ScoreInput
                      match={nextMatch}
                      onSuccess={() => handleScoreSubmitted(nextMatch.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match history */}
          {matches.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>
              {t('portal.no_matches')}
            </p>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,29,114,.05)',
            }}>
              <div style={{ padding: '12px 14px 8px', fontSize: 12, fontWeight: 700, color: '#001d72' }}>
                {t('portal.history')}
              </div>
              {sorted.map((match, idx) => (
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
                  isLast={idx === sorted.length - 1}
                />
              ))}
            </div>
          )}

          {/* Info box */}
          <div style={{
            background: 'rgba(255,255,255,.7)',
            border: '1px solid #eef2f7',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 11,
            color: '#64748b',
            lineHeight: 1.5,
          }}>
            Envía el resultado después de cada partido. Tu rival deberá confirmarlo. En caso de desacuerdo, el administrador resolverá la disputa.
          </div>
        </>
      )}
    </div>
  )
}

// ── Individual match row ──────────────────────────────────────────────────────
function MatchRow({ match, coupleId, expanded, onToggleExpand, onScoreSubmitted, onConfirm, onDispute, isLast }) {
  const { t } = useI18n()
  const isSubmitter  = match.submitted_by === coupleId
  const isParticipant = match.couple_a_id === coupleId || match.couple_b_id === coupleId
  const canSubmit    = match.status === 'scheduled' && isParticipant
  const canConfirm   = match.status === 'pending_confirmation' && isParticipant && !isSubmitter

  const aIsMe = match.couple_a_id === coupleId
  const bIsMe = match.couple_b_id === coupleId
  const aWon  = match.winner_id === match.couple_a_id
  const bWon  = match.winner_id === match.couple_b_id

  return (
    <div style={{ borderTop: '1px solid #f8fafc' }}>
      <button
        onClick={onToggleExpand}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textAlign: 'left',
        }}
      >
        {/* Court / time */}
        <div style={{ fontSize: 9, color: '#b0b8c8', flexShrink: 0, minWidth: 60 }}>
          {match.court && <div style={{ color: '#11efb5', fontWeight: 600 }}>{match.court}</div>}
          {match.time_slot && <div>{match.time_slot}</div>}
        </div>

        {/* Couple A */}
        <div style={{
          flex: 1,
          textAlign: 'right',
          fontWeight: aWon ? 700 : 400,
          color: aWon ? '#001d72' : '#94a3b8',
          fontSize: 11,
          lineHeight: 1.3,
        }}>
          {aIsMe && <div style={{ fontSize: 8, color: '#11efb5', fontWeight: 600 }}>{t('portal.you')}</div>}
          {formatName(match.couple_a?.team_name, 18)}
        </div>

        {/* Score */}
        <div style={{
          background: match.status === 'confirmed' ? 'rgba(17,239,181,.12)' : '#f8fafc',
          borderRadius: 6,
          padding: '3px 7px',
          fontFamily: 'DM Mono, monospace',
          fontWeight: 700,
          fontSize: 11,
          color: match.status === 'confirmed' ? '#0cb882' : '#94a3b8',
          flexShrink: 0,
          minWidth: 50,
          textAlign: 'center',
        }}>
          {match.score_a ? match.score_a : t('match.vs')}
        </div>

        {/* Couple B */}
        <div style={{
          flex: 1,
          fontWeight: bWon ? 700 : 400,
          color: bWon ? '#001d72' : '#94a3b8',
          fontSize: 11,
          lineHeight: 1.3,
        }}>
          {bIsMe && <div style={{ fontSize: 8, color: '#11efb5', fontWeight: 600 }}>{t('portal.you')}</div>}
          {formatName(match.couple_b?.team_name, 18)}
        </div>

        {/* Status badge */}
        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={match.status} />
        </div>
      </button>

      {/* Expanded actions */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #f1f5f9',
          padding: '12px 14px',
          background: '#fafbff',
        }}>
          {canSubmit && (
            <ScoreInput match={match} onSuccess={onScoreSubmitted} />
          )}

          {canConfirm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>
                <span style={{ fontWeight: 600, color: '#001d72' }}>
                  {match.couple_a_id === match.submitted_by
                    ? match.couple_a?.team_name
                    : match.couple_b?.team_name}
                </span>{' '}
                {t('portal.opponent_submitted')}:
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#001d72', marginLeft: 6 }}>
                  {match.score_a}
                </span>
              </p>
              <button onClick={onConfirm} style={{
                width: '100%',
                background: 'linear-gradient(135deg,#11efb5,#0cb882)',
                color: '#001d72',
                fontWeight: 700,
                fontSize: 13,
                borderRadius: 12,
                border: 'none',
                padding: '11px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(17,239,181,.25)',
              }}>
                {t('portal.confirm_result')}
              </button>
              <button onClick={onDispute} style={{
                width: '100%',
                background: 'white',
                border: '1px solid #fecaca',
                color: '#ef4444',
                fontWeight: 600,
                fontSize: 12,
                borderRadius: 12,
                padding: '10px',
                cursor: 'pointer',
              }}>
                {t('portal.dispute_result')}
              </button>
            </div>
          )}

          {match.status === 'pending_confirmation' && isSubmitter && (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0, padding: '4px 0' }}>
              Esperando confirmación del rival…
            </p>
          )}

          {match.status === 'disputed' && (
            <p style={{ fontSize: 12, color: '#ef4444', textAlign: 'center', margin: 0, padding: '4px 0' }}>
              Resultado en disputa. El administrador resolverá este partido.
            </p>
          )}

          {match.status === 'confirmed' && (
            <p style={{ fontSize: 12, color: '#0cb882', textAlign: 'center', fontWeight: 600, margin: 0, padding: '4px 0' }}>
              ✓ Resultado confirmado
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
