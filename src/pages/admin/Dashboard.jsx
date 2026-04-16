import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import AdminGuard from '../../components/AdminGuard.jsx'
import Spinner from '../../components/Spinner.jsx'
import { useDevMode } from '../../contexts/DevMode.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { DUMMY_COUPLES } from '../../lib/dummy.js'

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  )
}

function DashboardContent() {
  const { t } = useI18n()
  const devMode = useDevMode()
  const [stats, setStats] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [statsKey, setStatsKey] = useState(0)
  const [devEmail, setDevEmail] = useState('')
  const [devError, setDevError] = useState('')
  const [devLoading, setDevLoading] = useState(false)
  const [randomizing, setRandomizing]       = useState(false)
  const [randomizeError, setRandomizeError] = useState('')
  const [randomizeDone, setRandomizeDone]   = useState(false)

  async function handleRandomize() {
    setRandomizing(true)
    setRandomizeError('')
    setRandomizeDone(false)
    const { error } = await supabase.rpc('randomize_group_results')
    setRandomizing(false)
    if (error) {
      setRandomizeError(error.message)
    } else {
      setRandomizeDone(true)
      setStatsKey(k => k + 1)
    }
  }

  const SECTIONS = [
    { to: '/admin/couples',  label: t('admin.couples'),  icon: '👥', desc: t('admin.manage_couples_desc') },
    { to: '/admin/matches',  label: t('admin.matches'),  icon: '🎾', desc: t('admin.manage_matches_desc') },
    { to: '/admin/brackets', label: t('admin.brackets'), icon: '🏆', desc: t('admin.manage_brackets_desc') },
  ]

  async function handleReset() {
    setResetting(true)
    setConfirmReset(false)
    setResetError('')
    const { error } = await supabase.rpc('reset_scores')
    setResetting(false)
    if (error) {
      setResetError(error.message)
    } else {
      setStatsKey(k => k + 1)
    }
  }

  async function handleDevApply() {
    if (!devEmail.trim()) return
    setDevLoading(true)
    setDevError('')
    const result = await devMode.setDev(devEmail.trim())
    setDevLoading(false)
    if (result.error) setDevError(t('admin.dev_not_found'))
  }

  useEffect(() => {
    setStats(null)
    Promise.all([
      supabase.from('couples').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    ]).then(([couples, matches, disputed, confirmed]) => {
      setStats({
        couples:   couples.count  ?? DUMMY_COUPLES.length,
        matches:   matches.count  ?? 0,
        disputed:  disputed.count ?? 0,
        confirmed: confirmed.count ?? 0,
      })
    })
  }, [statsKey])

  const statCards = stats ? [
    { label: t('admin.couples'),   value: stats.couples,   color: 'text-primary',   urgent: false },
    { label: t('admin.matches'),   value: stats.matches,   color: 'text-primary',   urgent: false },
    { label: t('admin.confirmed'), value: stats.confirmed, color: 'text-green-600', urgent: false },
    { label: t('admin.disputed'),  value: stats.disputed,  urgent: stats.disputed > 0,
      color: stats.disputed > 0 ? 'text-red-600 font-extrabold' : 'text-text-secondary' },
  ] : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t('admin.dashboard')}</h1>
        <p className="text-text-secondary text-sm mt-1">{t('admin.subtitle')}</p>
      </div>

      {/* Stats */}
      {!stats ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className={`border rounded-xl p-4 shadow-sm text-center transition-colors
              ${s.urgent ? 'bg-red-50 border-red-200' : 'bg-surface border-gray-100'}`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
              {s.urgent && (
                <div className="text-xs text-red-500 mt-1 font-medium">{t('admin.attention')}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SECTIONS.map(s => (
          <Link key={s.to} to={s.to}
            className="bg-surface border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-accent transition-all group">
            <div className="text-3xl mb-3">{s.icon}</div>
            <div className="font-bold text-primary text-base group-hover:text-secondary transition-colors">
              {s.label}
            </div>
            <div className="text-xs text-text-secondary mt-1">{s.desc}</div>
          </Link>
        ))}
      </div>

      {/* Dev mode panel */}
      <div style={{
        background: 'white',
        borderRadius: 14,
        padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,29,114,.05)',
        borderTop: '3px solid #0032a0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0032a0' }}>
            🧑‍💻 {t('admin.dev_mode')}
          </div>
          {devMode.active && (
            <span style={{
              background: 'rgba(4,51,255,.08)',
              color: '#0433FF',
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
            }}>
              {t('admin.dev_active')}: {devMode.email}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
          {t('admin.dev_mode_desc')}
        </p>

        {devMode.active ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              flex: 1,
              background: '#f0f9f5',
              border: '1px solid #11efb5',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              color: '#0cb882',
              fontWeight: 600,
            }}>
              {devMode.coupleInfo?.team_name} · {devMode.coupleInfo?.division?.toUpperCase()} {devMode.coupleInfo?.group_code}
            </div>
            <button onClick={devMode.clearDev} style={{
              background: '#fef2f2',
              color: '#ef4444',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {t('admin.dev_clear')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={devEmail}
              onChange={e => { setDevEmail(e.target.value); setDevError('') }}
              placeholder={t('admin.dev_email_placeholder')}
              onKeyDown={e => e.key === 'Enter' && handleDevApply()}
              style={{
                flex: 1,
                border: devError ? '1px solid #fecaca' : '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '7px 12px',
                fontSize: 12,
                outline: 'none',
                color: '#0f172a',
              }}
            />
            <button onClick={handleDevApply} disabled={devLoading} style={{
              background: devLoading ? '#f1f5f9' : '#0032a0',
              color: devLoading ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: devLoading ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {devLoading ? '…' : t('admin.dev_apply')}
            </button>
          </div>
        )}
        {devError && (
          <p style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{devError}</p>
        )}

        {/* Randomize groups */}
        <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
            {t('admin.dev_randomize_desc')}
          </p>
          <button onClick={handleRandomize} disabled={randomizing} style={{
            background: randomizing ? '#f1f5f9' : 'rgba(4,51,255,.07)',
            color: randomizing ? '#94a3b8' : '#0433FF',
            border: '1px solid',
            borderColor: randomizing ? '#e2e8f0' : 'rgba(4,51,255,.2)',
            borderRadius: 8,
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 600,
            cursor: randomizing ? 'default' : 'pointer',
          }}>
            {randomizing ? t('admin.dev_randomizing') : t('admin.dev_randomize')}
          </button>
          {randomizeError && (
            <p style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{randomizeError}</p>
          )}
          {randomizeDone && (
            <p style={{ color: '#0cb882', fontSize: 11, marginTop: 6 }}>✓ {t('admin.dev_randomize_done')}</p>
          )}
        </div>
      </div>

      {/* Reset scores */}
      <div style={{
        background: 'white',
        borderRadius: 14,
        padding: '16px 20px',
        boxShadow: '0 1px 4px rgba(0,29,114,.05)',
        borderTop: '3px solid #fecaca',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0032a0', marginBottom: 4 }}>
          {t('admin.reset_scores')}
        </div>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
          {t('admin.reset_scores_desc')}
        </p>

        {resetError && (
          <p style={{ color: '#ef4444', fontSize: 11, marginBottom: 8 }}>{resetError}</p>
        )}
        {confirmReset ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, margin: 0 }}>
              ⚠️ {t('admin.reset_scores_confirm')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} disabled={resetting} style={{
                background: resetting ? '#f1f5f9' : '#ef4444',
                color: resetting ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: resetting ? 'default' : 'pointer',
              }}>
                {resetting ? t('admin.resetting') : t('admin.reset_scores_yes')}
              </button>
              <button onClick={() => setConfirmReset(false)} style={{
                background: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}>
                {t('brackets.btn_cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} disabled={resetting} style={{
            background: '#fef2f2',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            {t('admin.reset_scores')}
          </button>
        )}
      </div>
    </div>
  )
}
