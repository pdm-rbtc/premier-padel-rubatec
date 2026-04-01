import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import GroupTable from '../components/GroupTable.jsx'
import BracketView from '../components/BracketView.jsx'
import Timeline from '../components/Timeline.jsx'
import { DIVISION_CONFIG, DIVISIONS } from '../lib/divisions.js'
import { getDummyStandings } from '../lib/dummy.js'
import { supabase } from '../lib/supabase.js'

const GROUP_CODES = {
  diamant: ['G1', 'G2', 'G3'],
  or:      ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
  plata:   ['G1', 'G2', 'G3'],
}

const TOTAL_COUPLES = DIVISIONS.reduce((t, d) => t + GROUP_CODES[d].length * 4, 0)

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      padding: '13px 14px',
      boxShadow: '0 1px 4px rgba(0,29,114,.05)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flex: '1 1 130px',
      minWidth: 0,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: color + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#001d72' }}>{value ?? '—'}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  )
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeDiv = DIVISIONS.includes(searchParams.get('div'))
    ? searchParams.get('div')
    : 'diamant'
  const setActiveDiv = (d) => setSearchParams({ div: d }, { replace: true })

  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('couples').select('id', { count: 'exact', head: true }),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'pending_confirmation'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'disputed'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).in('status', ['scheduled', 'pending_confirmation', 'disputed']),
    ]).then(([couples, confirmed, pending, disputed, remaining]) => {
      setStats({
        couples:   couples.count   || TOTAL_COUPLES,
        played:    confirmed.count ?? 0,
        pending:   pending.count   ?? 0,
        disputes:  disputed.count  ?? 0,
        remaining: remaining.count ?? 0,
      })
    })
  }, [])

  const groups = GROUP_CODES[activeDiv]
  const cfg    = DIVISION_CONFIG[activeDiv]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Timeline />

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatCard label="Parejas"    value={stats?.couples}   icon="👥" color="#0433FF" />
        <StatCard label="Jugados"    value={stats?.played}    icon="✅" color="#11efb5" />
        <StatCard label="Pendientes" value={stats?.pending}   icon="⏳" color="#ff8000" />
        <StatCard label="Disputas"   value={stats?.disputes}  icon="⚠️" color="#ef4444" />
        <StatCard label="Restantes"  value={stats?.remaining} icon="📅" color="#94a3b8" />
      </div>

      {/* Division tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        background: 'white',
        borderRadius: 12,
        padding: 4,
        boxShadow: '0 1px 4px rgba(0,29,114,.05)',
      }}>
        {DIVISIONS.map(d => {
          const dc     = DIVISION_CONFIG[d]
          const active = d === activeDiv
          return (
            <button key={d} onClick={() => setActiveDiv(d)}
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all .2s',
                background: active ? `linear-gradient(135deg,#001d72,${dc.color})` : 'transparent',
                color: active ? 'white' : '#94a3b8',
                boxShadow: active ? '0 2px 8px rgba(0,29,114,.15)' : 'none',
              }}
            >
              {dc.icon} {dc.label}
              <span style={{ fontSize: 9, opacity: .7, marginLeft: 3 }}>
                {GROUP_CODES[d].length}g·{GROUP_CODES[d].length * 4}p
              </span>
            </button>
          )
        })}
      </div>

      {/* Group tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 10 }}>
        {groups.map(g => (
          <GroupTable
            key={`${activeDiv}-${g}`}
            division={activeDiv}
            groupCode={g}
            standings={getDummyStandings(activeDiv, g)}
          />
        ))}
      </div>

      {/* Bracket */}
      <div style={{
        background: 'white',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 1px 4px rgba(0,29,114,.05)',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#001d72', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🏆</span> Fase Eliminatoria
        </div>
        <BracketView division={activeDiv} />
      </div>

      {/* Guarantee note */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(17,239,181,.05),rgba(4,51,255,.03))',
        borderRadius: 10,
        padding: '10px 14px',
        border: '1px solid rgba(17,239,181,.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
          <strong style={{ color: '#001d72' }}>Garantía de juego: </strong>
          Todos juegan 3 partidos de grupo + mínimo 1 de eliminatoria/consolación.
        </div>
      </div>
    </div>
  )
}
