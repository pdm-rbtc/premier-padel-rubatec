import { useAuth } from '../../hooks/useAuth.js'
import { t } from '../../i18n/index.js'

export default function ManageBrackets() {
  const { isAdmin } = useAuth()

  if (!isAdmin) return <div className="text-center py-10 text-red-600">{t('errors.not_authorized')}</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">{t('admin.brackets')}</h1>
      <p className="text-text-secondary">La generación automática de cuadros se implementará en la siguiente fase.</p>
    </div>
  )
}
