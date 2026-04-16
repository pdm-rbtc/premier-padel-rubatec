import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../hooks/useAuth.js'
import { useDevMode } from '../contexts/DevMode.jsx'
import { signOut } from '../lib/auth.js'
import { useMatches } from '../hooks/useMatches.js'
import ScoreInput from '../components/ScoreInput.jsx'
import LiveBadge from '../components/LiveBadge.jsx'
import { formatName } from '../lib/utils.js'
import { useI18n } from '../i18n/index.jsx'

// ── Round label helper ────────────────────────────────────────────────────────
const KNOCKOUT_LABELS = {
  quarter:     'Cuartos de final',
  semi:        'Semifinal',
  final:       'Final',
  third_place: '3er/4o Puesto',
  consolation: 'Consolación',
}

function matchRoundLabel(match) {
  if (!match) return ''
  if (match.phase === 'group') {
    const parts = ['Grupos']
    if (match.group_code) parts.push(match.group_code)
    if (match.round)      parts.push(match.round)
    return parts.join(' · ')
  }
  return KNOCKOUT_LABELS[match.round] ?? 'Eliminatoria'
}

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
  const devMode = useDevMode()

  const [emailInput, setEmailInput]     = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError]     = useState('')

  const [showPin, setShowPin]       = useState(false)
  const [pinInput, setPinInput]     = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError]     = useState('')

  async function handleEmailLogin() {
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    setEmailLoading(true)
    setEmailError('')
    const result = await devMode.setDev(email)
    setEmailLoading(false)
    if (result.error) {
      setEmailError(t('portal.login_email_error'))
    }
  }

  async function handlePinLogin() {
    if (!pinInput.trim()) return
    setPinLoading(true)
    setPinError('')
    const result = await devMode.setDevByPin(pinInput)
    setPinLoading(false)
    if (result.error) setPinError(t('portal.pin_not_found'))
  }

  if (loading) return null

  // Allow access if real user OR active PIN session
  if (!user && !devMode.active) {
    return (
      <div style={{ maxWidth: 380, margin: '60px auto 0', textAlign: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: '40px 32px',
          boxShadow: '0 4px 24px rgba(0,29,114,.08)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
          <h1 style={{ color: '#0032a0', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{t('portal.login_title')}</h1>
          <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5, margin: '0 0 28px' }}>
            {t('portal.login_subtitle')}
          </p>

          {/* Email login */}
          <div style={{ textAlign: 'left' }}>
            <input
              type="email"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setEmailError('') }}
              onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
              placeholder={t('portal.login_email_placeholder')}
              autoFocus
              style={{
                width: '100%',
                border: emailError ? '1px solid #fecaca' : '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
                color: '#0f172a',
                marginBottom: 10,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleEmailLogin}
              disabled={emailLoading || !emailInput.trim()}
              style={{
                width: '100%',
                background: emailLoading || !emailInput.trim() ? '#f1f5f9' : 'linear-gradient(135deg,#0032a0,#0433FF)',
                color: emailLoading || !emailInput.trim() ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px',
                fontWeight: 700,
                fontSize: 14,
                cursor: emailLoading || !emailInput.trim() ? 'default' : 'pointer',
                boxShadow: emailLoading || !emailInput.trim() ? 'none' : '0 4px 14px rgba(0,29,114,.25)',
              }}
            >
              {emailLoading ? t('portal.login_email_sending') : t('portal.login_email_button')}
            </button>
            {emailError && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{emailError}</p>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{t('portal.login_or')}</span>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {/* PIN login toggle */}
          {!showPin ? (
            <>
              <button
                onClick={() => setShowPin(true)}
                style={{
                  width: '100%',
                  background: 'rgba(0,29,114,.04)',
                  border: '1px solid rgba(0,29,114,.12)',
                  color: '#0032a0',
                  padding: '11px 20px',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                🔑 {t('portal.login_pin')}
              </button>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, lineHeight: 1.5 }}>
                {t('portal.pin_hint')}
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
                {t('portal.pin_desc')}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={pinInput}
                  onChange={e => { setPinInput(e.target.value.toUpperCase()); setPinError('') }}
                  onKeyDown={e => e.key === 'Enter' && handlePinLogin()}
                  placeholder={t('portal.pin_placeholder')}
                  maxLength={8}
                  autoFocus
                  style={{
                    flex: 1,
                    border: pinError ? '1px solid #fecaca' : '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: 3,
                    textAlign: 'center',
                    outline: 'none',
                    fontFamily: 'DM Mono, monospace',
                    color: '#0032a0',
                  }}
                />
                <button
                  onClick={handlePinLogin}
                  disabled={pinLoading}
                  style={{
                    background: pinLoading ? '#f1f5f9' : '#0032a0',
                    color: pinLoading ? '#94a3b8' : 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: pinLoading ? 'default' : 'pointer',
                  }}
                >
                  {pinLoading ? '…' : t('portal.pin_apply')}
                </button>
              </div>
              {pinError && (
                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>{pinError}</p>
              )}
              <button
                onClick={() => { setShowPin(false); setPinInput(''); setPinError('') }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', marginTop: 8 }}
              >
                {t('portal.pin_cancel')}
              </button>
            </div>
          )}
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
  const devMode = useDevMode()
  const isPinSession = devMode.active && devMode.pinSession

  const { matches, loading: matchLoading, setMatches, connected } = useMatches(
    coupleId ? { coupleId } : {}
  )
  const [expandedMatchId, setExpandedMatchId] = useState(null)
  const [coupleInfo, setCoupleInfo] = useState(null)

  useEffect(() => {
    if (!coupleId) return
    // For PIN sessions, coupleInfo is already in devMode context
    if (isPinSession && devMode.coupleInfo) {
      setCoupleInfo(devMode.coupleInfo)
      return
    }
    supabase.from('couples').select('*').eq('id', coupleId).single()
      .then(({ data }) => { if (data) setCoupleInfo(data) })
  }, [coupleId, isPinSession])

  const isLoading = authLoading || matchLoading

  // Sort by time within each status bucket
  const byTime = [...matches].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))

  const nextMatch       = byTime.find(m => m.status === 'scheduled')
  const upcomingMatches = byTime.filter(m => m.status === 'scheduled' && m.id !== nextMatch?.id)

  // History: only finalized or in-progress matches (not plain scheduled)
  const STATUS_ORDER = { pending_confirmation: 0, disputed: 1, confirmed: 2 }
  const historyMatches = byTime
    .filter(m => m.status !== 'scheduled')
    .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))

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
    if (isPinSession) {
      const { error } = await supabase.rpc('confirm_match_pin', {
        p_match_id: matchId,
        p_pin:      devMode.pin,
        p_action:   'confirm',
      })
      if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'confirmed' } : m))
    } else {
      const { error } = await supabase.rpc('confirm_match', {
        p_match_id: matchId,
        p_actor_id: user.id,
      })
      if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'confirmed' } : m))
    }
  }

  async function handleDispute(matchId) {
    if (isPinSession) {
      const { error } = await supabase.rpc('confirm_match_pin', {
        p_match_id: matchId,
        p_pin:      devMode.pin,
        p_action:   'dispute',
      })
      if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'disputed' } : m))
    } else {
      const { error } = await supabase.from('matches').update({ status: 'disputed' }).eq('id', matchId)
      if (!error) setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: 'disputed' } : m))
    }
  }

  function handleSignOut() {
    if (devMode.active) {
      devMode.clearDev()
    } else {
      signOut()
    }
  }

  const displayName = isPinSession
    ? coupleInfo?.team_name ?? devMode.coupleInfo?.team_name
    : (profile?.display_name ?? user?.user_metadata?.full_name ?? user?.email)

  const userLabel = isPinSession
    ? `PIN · ${devMode.coupleInfo?.team_name ?? ''}`
    : user?.email

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* User info strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isPinSession && user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt=""
              style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #e2e8f0' }} />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: isPinSession ? 'rgba(4,51,255,.08)' : 'rgba(0,29,114,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPinSession ? '#0433FF' : '#0032a0', fontWeight: 700, fontSize: 12,
            }}>
              {isPinSession ? '🔑' : displayName?.[0]?.toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: 12, color: '#64748b' }}>{userLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LiveBadge connected={connected} />
          <button onClick={handleSignOut} style={{
            fontSize: 11, color: '#94a3b8', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 6px', borderRadius: 6,
          }}>
            {isPinSession ? t('portal.pin_exit') : t('portal.logout')}
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
            background: 'linear-gradient(135deg,#0032a0,#0433FF)',
            borderRadius: 16,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
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
              <div style={{ padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>{matchRoundLabel(nextMatch)}</span>
                  <div>
                    {nextMatch.court && <span style={{ color: '#11efb5', fontWeight: 600 }}>{nextMatch.court}</span>}
                    {nextMatch.court && nextMatch.time_slot && ' · '}
                    {nextMatch.time_slot && <span>{nextMatch.time_slot}</span>}
                  </div>
                </div>
                <StatusBadge status={nextMatch.status} />
              </div>
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
              <div style={{ padding: '0 14px 14px' }}>
                <button
                  onClick={() => setExpandedMatchId(
                    expandedMatchId === nextMatch.id ? null : nextMatch.id
                  )}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg,#11efb5,#0cb882)',
                    color: '#0032a0',
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

          {matches.length === 0 && (
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>
              {t('portal.no_matches')}
            </p>
          )}

          {/* Upcoming scheduled matches (after next) */}
          {upcomingMatches.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,29,114,.05)',
            }}>
              <div style={{ padding: '12px 14px 8px', fontSize: 12, fontWeight: 700, color: '#0032a0' }}>
                {t('portal.upcoming_matches')}
              </div>
              {upcomingMatches.map((match, idx, arr) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  coupleId={coupleId}
                  expanded={expandedMatchId === match.id}
                  onToggleExpand={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                  onScoreSubmitted={() => handleScoreSubmitted(match.id)}
                  onConfirm={() => handleConfirm(match.id)}
                  onDispute={() => handleDispute(match.id)}
                  isLast={idx === arr.length - 1}
                />
              ))}
            </div>
          )}

          {/* History: confirmed / pending / disputed only */}
          {historyMatches.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,29,114,.05)',
            }}>
              <div style={{ padding: '12px 14px 8px', fontSize: 12, fontWeight: 700, color: '#0032a0' }}>
                {t('portal.history')}
              </div>
              {historyMatches.map((match, idx, arr) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  coupleId={coupleId}
                  expanded={expandedMatchId === match.id}
                  onToggleExpand={() => setExpandedMatchId(expandedMatchId === match.id ? null : match.id)}
                  onScoreSubmitted={() => handleScoreSubmitted(match.id)}
                  onConfirm={() => handleConfirm(match.id)}
                  onDispute={() => handleDispute(match.id)}
                  isLast={idx === arr.length - 1}
                />
              ))}
            </div>
          )}

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
        <div style={{ fontSize: 9, color: '#b0b8c8', flexShrink: 0, minWidth: 68 }}>
          <div style={{ color: '#94a3b8', fontSize: 9, fontWeight: 600, marginBottom: 1 }}>{matchRoundLabel(match)}</div>
          {match.court && <div style={{ color: '#11efb5', fontWeight: 600 }}>{match.court}</div>}
          {match.confirmed_at
            ? <div style={{ color: '#0cb882' }}>
                {new Date(match.confirmed_at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </div>
            : match.time_slot && <div>{match.time_slot}</div>
          }
        </div>

        <div style={{
          flex: 1,
          textAlign: 'right',
          fontWeight: aWon ? 700 : 400,
          color: aWon ? '#0032a0' : '#94a3b8',
          fontSize: 11,
          lineHeight: 1.3,
        }}>
          {aIsMe && <div style={{ fontSize: 8, color: '#11efb5', fontWeight: 600 }}>{t('portal.you')}</div>}
          {formatName(match.couple_a?.team_name, 18)}
        </div>

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

        <div style={{
          flex: 1,
          fontWeight: bWon ? 700 : 400,
          color: bWon ? '#0032a0' : '#94a3b8',
          fontSize: 11,
          lineHeight: 1.3,
        }}>
          {bIsMe && <div style={{ fontSize: 8, color: '#11efb5', fontWeight: 600 }}>{t('portal.you')}</div>}
          {formatName(match.couple_b?.team_name, 18)}
        </div>

        <div style={{ flexShrink: 0 }}>
          <StatusBadge status={match.status} />
        </div>
      </button>

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
                <span style={{ fontWeight: 600, color: '#0032a0' }}>
                  {match.couple_a_id === match.submitted_by
                    ? match.couple_a?.team_name
                    : match.couple_b?.team_name}
                </span>{' '}
                {t('portal.opponent_submitted')}:
                <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, color: '#0032a0', marginLeft: 6 }}>
                  {match.score_a}
                </span>
              </p>
              <button onClick={onConfirm} style={{
                width: '100%',
                background: 'linear-gradient(135deg,#11efb5,#0cb882)',
                color: '#0032a0',
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

