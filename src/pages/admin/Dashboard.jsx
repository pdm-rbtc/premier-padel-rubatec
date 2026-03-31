import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { t } from '../../i18n/index.js'

export default function AdminDashboard() {
  const { isAdmin } = useAuth()

  if (!isAdmin) return <div className="text-center py-10 text-red-600">{t('errors.not_authorized')}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">{t('admin.dashboard')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/couples', label: t('admin.couples') },
          { to: '/admin/matches', label: t('admin.matches') },
          { to: '/admin/brackets', label: t('admin.brackets') },
        ].map(item => (
          <Link key={item.to} to={item.to} className="bg-surface border border-gray-100 rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:border-accent transition-all">
            <div className="font-bold text-primary text-lg">{item.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
