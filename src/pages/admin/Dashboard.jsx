import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import AdminGuard from '../../components/AdminGuard.jsx'
import { DUMMY_COUPLES } from '../../lib/dummy.js'

const SECTIONS = [
  { to: '/admin/couples',  label: 'Parejas',  icon: '👥', desc: 'Gestionar parejas e importar CSV' },
  { to: '/admin/matches',  label: 'Partidos', icon: '🎾', desc: 'Ver partidos y resolver disputas' },
  { to: '/admin/brackets', label: 'Cuadros',  icon: '🏆', desc: 'Generar fase eliminatoria' },
]

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <DashboardContent />
    </AdminGuard>
  )
}

function DashboardContent() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
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
  }, [])

  const statCards = stats ? [
    { label: 'Parejas',    value: stats.couples,   color: 'text-primary' },
    { label: 'Partidos',   value: stats.matches,   color: 'text-primary' },
    { label: 'Confirmados',value: stats.confirmed, color: 'text-green-600' },
    { label: 'En disputa', value: stats.disputed,  color: stats.disputed > 0 ? 'text-red-600' : 'text-text-secondary' },
  ] : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Panel de administración</h1>
        <p className="text-text-secondary text-sm mt-1">3r Torneo Premium Pádel Rubatec</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map(s => (
            <div key={s.label} className="bg-surface border border-gray-100 rounded-xl p-4 shadow-sm text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-secondary mt-1">{s.label}</div>
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
    </div>
  )
}
