import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { signInWithGoogle } from '../lib/auth.js'
import { useI18n } from '../i18n/index.jsx'
import LiveTicker from './LiveTicker.jsx'

function Isotype() {
  return (
    <div style={{
      background: 'linear-gradient(135deg,#11efb5,#0433FF)',
      width: 30,
      height: 30,
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 14,
      fontWeight: 700,
      color: 'white',
      flexShrink: 0,
    }}>
      R
    </div>
  )
}

export default function Layout() {
  const { user, isAdmin } = useAuth()
  const { pathname } = useLocation()
  const { t, lang, setLang } = useI18n()
  const onPortal = pathname.startsWith('/portal')
  const onAdmin  = pathname.startsWith('/admin')

  const tabCls = (active) => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all .2s',
    background: active ? 'rgba(17,239,181,.15)' : 'rgba(255,255,255,.06)',
    color: active ? '#11efb5' : 'rgba(255,255,255,.5)',
    textDecoration: 'none',
    display: 'inline-block',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(170deg,#f0f2f8 0%,#e4e9f2 50%,#dfe5f0 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(140deg,#001050 0%,#001d72 40%,#0a2a8a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative radial gradients */}
        <div style={{
          position: 'absolute', top: -80, right: -40,
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(17,239,181,.12) 0%,transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -50, left: '25%',
          width: 350, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(4,51,255,.15) 0%,transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '22px 18px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Isotype />
                <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 500, letterSpacing: '1.5px' }}>
                  RUBATEC · 2026
                </span>
              </div>
              <h1 style={{ color: 'white', fontSize: 21, fontWeight: 700, margin: '4px 0 2px', letterSpacing: '-.3px' }}>
                3r {lang === 'ca' ? 'Torneig' : 'Torneo'} Premium Pádel
              </h1>
              <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, margin: 0 }}>
                {t('home.subtitle')} · 48 {t('home.parejas')} · 12 {t('home.pistas')}
              </p>
            </div>

            {/* Nav tabs + language toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginTop: 5 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <Link to="/" style={tabCls(!onPortal && !onAdmin)}>🏆 {t('nav.torneo')}</Link>
                {user
                  ? <Link to="/portal" style={tabCls(onPortal)}>👤 {t('nav.portal')}</Link>
                  : <button onClick={signInWithGoogle} style={tabCls(false)}>👤 {t('nav.portal')}</button>
                }
                {isAdmin && <Link to="/admin" style={tabCls(onAdmin)}>⚙️ {t('nav.admin')}</Link>}
              </div>
              {/* Language toggle */}
              <div style={{ display: 'flex', gap: 3 }}>
                {['es', 'ca'].map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    padding: '3px 9px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    letterSpacing: '0.5px',
                    background: lang === l ? 'rgba(17,239,181,.2)' : 'rgba(255,255,255,.06)',
                    color: lang === l ? '#11efb5' : 'rgba(255,255,255,.35)',
                    transition: 'all .2s',
                  }}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <LiveTicker />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 18px 50px' }}>
        <Outlet />
      </main>
    </div>
  )
}
