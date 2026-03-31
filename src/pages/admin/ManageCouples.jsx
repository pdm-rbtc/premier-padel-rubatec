import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../hooks/useAuth.js'
import { t } from '../../i18n/index.js'

export default function ManageCouples() {
  const { isAdmin } = useAuth()
  const [couples, setCouples] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('couples').select('*').order('division').then(({ data }) => {
      setCouples(data ?? [])
      setLoading(false)
    })
  }, [])

  if (!isAdmin) return <div className="text-center py-10 text-red-600">{t('errors.not_authorized')}</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">{t('admin.couples')}</h1>
      {loading ? (
        <p className="text-text-secondary">Cargando...</p>
      ) : (
        <div className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-text-secondary text-xs">
              <tr>
                <th className="text-left px-4 py-2">Pareja</th>
                <th className="text-left px-4 py-2">División</th>
                <th className="text-left px-4 py-2">Grupo</th>
                <th className="text-left px-4 py-2">Jugadores</th>
              </tr>
            </thead>
            <tbody>
              {couples.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-medium">{c.team_name}</td>
                  <td className="px-4 py-2 capitalize">{c.division}</td>
                  <td className="px-4 py-2">{c.group_code}</td>
                  <td className="px-4 py-2 text-text-secondary">{c.player_1_name} / {c.player_2_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
