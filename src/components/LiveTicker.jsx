import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { DIVISION_CONFIG } from '../lib/divisions.js'

async function fetchLiveMatches() {
  const { data } = await supabase
    .from('matches')
    .select('court, division, group_code, score_a, score_b, status, couple_a:couple_a_id(team_name), couple_b:couple_b_id(team_name)')
    .in('status', ['pending_confirmation', 'confirmed'])
    .order('confirmed_at', { ascending: false })
    .limit(8)
  return data ?? []
}

export default function LiveTicker() {
  const [items, setItems] = useState([])
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    fetchLiveMatches().then(data => {
      setItems(data.map(m => ({
        court: m.court ?? '',
        div: `${DIVISION_CONFIG[m.division]?.label ?? m.division}${m.group_code ? ' ' + m.group_code : ''}`,
        score: m.score_a ?? '',
      })))
    })
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    const timer = setInterval(() => setOffset(v => v - 0.8), 30)
    return () => clearInterval(timer)
  }, [items.length])

  const liveCount = items.length

  if (items.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(90deg,#001d72,#0433FF)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          background: '#475569',
          width: 6, height: 6,
          borderRadius: '50%',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, fontWeight: 600, letterSpacing: '1px' }}>
          EN DIRECTO · Sin partidos en curso
        </span>
      </div>
    )
  }

  const displayItems = [...items, ...items, ...items, ...items]

  return (
    <div style={{
      background: 'linear-gradient(90deg,#001d72,#0433FF)',
      padding: '8px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Fixed "EN DIRECTO" label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        position: 'absolute',
        left: 0,
        top: 0,
        padding: '8px 12px',
        zIndex: 2,
        background: 'linear-gradient(90deg,#001050 80%,transparent)',
        height: '100%',
        boxSizing: 'border-box',
      }}>
        <span style={{
          background: '#ef4444',
          width: 6,
          height: 6,
          borderRadius: '50%',
          animation: 'pulse 1.5s infinite',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <span style={{ color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '1px', whiteSpace: 'nowrap' }}>
          EN DIRECTO{liveCount > 0 ? ` ${liveCount}` : ''}
        </span>
      </div>

      {/* Scrolling strip */}
      <div style={{
        display: 'flex',
        gap: 50,
        whiteSpace: 'nowrap',
        transform: `translateX(${offset % 1400}px)`,
        marginLeft: 130,
      }}>
        {displayItems.map((m, i) => (
          <span key={i} style={{ color: 'rgba(255,255,255,.85)', fontSize: 11 }}>
            <span style={{ color: '#11efb5', fontWeight: 600 }}>{m.court}</span>
            {m.court && ' · '}
            {m.div}
            {m.score && (
              <span style={{ color: '#11efb5', fontWeight: 700 }}> {m.score}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
