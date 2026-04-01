import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { signInWithGoogle, signOut } from '../lib/auth.js'
import { DIVISION_CONFIG, DIVISIONS } from '../lib/divisions.js'
import { t } from '../i18n/index.js'

const AUTH_BTN_DESKTOP = 'bg-accent text-primary px-3 py-1.5 rounded-full font-semibold text-sm hover:opacity-90 transition-opacity'
const AUTH_BTN_MOBILE  = 'w-full text-center bg-accent text-primary px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity'

export default function Navbar() {
  const { user, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const close = () => setMenuOpen(false)
  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  const navLinks = [
    ...DIVISIONS.map(d => ({ to: `/bracket/${d}`, label: DIVISION_CONFIG[d].label })),
    ...(user    ? [{ to: '/portal', label: t('nav.portal') }] : []),
    ...(isAdmin ? [{ to: '/admin',  label: t('nav.admin')  }] : []),
  ]

  return (
    <nav className="bg-primary text-white shadow-md relative z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" onClick={close} className="font-bold text-lg text-accent tracking-tight">
          Pádel Rubatec
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to}
              className={`transition-colors ${
                isActive(l.to) ? 'text-accent font-semibold' : 'text-white/80 hover:text-white'
              }`}>
              {l.label}
            </Link>
          ))}
          {user
            ? <button onClick={signOut} className={AUTH_BTN_DESKTOP}>{t('nav.logout')}</button>
            : <button onClick={signInWithGoogle} className={AUTH_BTN_DESKTOP}>{t('nav.login')}</button>
          }
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="sm:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Menú"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 px-4 py-3 space-y-1">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={close}
              className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive(l.to)
                  ? 'bg-white/10 text-accent font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            {user
              ? <button onClick={() => { signOut(); close() }} className={AUTH_BTN_MOBILE}>{t('nav.logout')}</button>
              : <button onClick={() => { signInWithGoogle(); close() }} className={AUTH_BTN_MOBILE}>{t('nav.login')}</button>
            }
          </div>
        </div>
      )}
    </nav>
  )
}
