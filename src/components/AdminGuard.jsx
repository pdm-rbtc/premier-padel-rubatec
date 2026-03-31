import { useAuth } from '../hooks/useAuth.js'

export default function AdminGuard({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  if (!isAdmin) return (
    <div className="text-center py-20 text-red-500 text-sm">
      No tienes permiso para acceder a esta sección.
    </div>
  )
  return children
}
