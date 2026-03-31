import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { signInWithGoogle, signOut } from '../lib/auth.js'
import { t } from '../i18n/index.js'

export default function Navbar() {
  const { user, isAdmin } = useAuth()

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-accent tracking-tight">
          Pádel Rubatec
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/bracket/diamant" className="hover:text-accent transition-colors">Diamant</Link>
          <Link to="/bracket/or" className="hover:text-accent transition-colors">Or</Link>
          <Link to="/bracket/plata" className="hover:text-accent transition-colors">Plata</Link>
          {user && <Link to="/portal" className="hover:text-accent transition-colors">{t('nav.portal')}</Link>}
          {isAdmin && <Link to="/admin" className="hover:text-accent transition-colors">{t('nav.admin')}</Link>}
          {user ? (
            <button onClick={signOut} className="bg-accent text-primary px-3 py-1 rounded-full font-semibold hover:opacity-90">
              {t('nav.logout')}
            </button>
          ) : (
            <button onClick={signInWithGoogle} className="bg-accent text-primary px-3 py-1 rounded-full font-semibold hover:opacity-90">
              {t('nav.login')}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
