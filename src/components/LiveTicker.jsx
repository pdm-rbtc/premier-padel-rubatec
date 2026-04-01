import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { DIVISION_CONFIG } from '../lib/divisions.js'
import { useRealtime } from '../hooks/useRealtime.js'

async function fetchActiveMatches() {
  const { data } = await supabase
    .from('matches')
    .select(`
      id, court, division, group_code, round,
      score_a, score_b, status,
      couple_a:couple_a_id(team_name),
      couple_b:couple_b_id(team_name)
    `)
    .in('status', ['pending_confirmation', 'confirmed'])
    .order('confirmed_at', { ascending: false })
    .limit(12)
  return data ?? []
}

function formatItem(match) {
  const divLabel = DIVISION_CONFIG[match.division]?.label ?? match.division
  const loc = match.group_code
    ? `${divLabel} ${match.group_code}`
    : divLabel
  const court = match.court ? `${match.court} · ` : ''
  const score = match.score_a ? ` ${match.score_a}–${match.score_b}` : ''
  return `${court}${loc}${score}`
}

export default function LiveTicker() {
  const [matches, setMatches] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetchActiveMatches().then(setMatches)
  }, [refreshKey])

  useRealtime('matches', () => setRefreshKey(k => k + 1))

  const liveCount = matches.filter(m => m.status === 'pending_confirmation').length

  const items = matches.length > 0
    ? matches.map(formatItem)
    : [
        'Torneo en curso',
        'Los marcadores aparecerán aquí en tiempo real',
        '3r Torneo Premium Pádel Rubatec',
      ]

  // Duplicate for seamless infinite loop
  const tickerItems = [...items, ...items]

  return (
    <div className="bg-[#001050] text-white text-xs flex items-stretch overflow-hidden select-none">
      {/* Fixed badge */}
      <div className="shrink-0 flex items-center gap-1.5 bg-accent text-primary font-bold px-3 py-2 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        EN DIRECTO{liveCount > 0 ? ` ${liveCount}` : ''}
      </div>

      {/* Scrolling strip */}
      <div className="overflow-hidden flex-1 flex items-center">
        <div className="flex animate-ticker">
          {tickerItems.map((item, i) => (
            <span key={i} className="whitespace-nowrap px-6 opacity-90">
              {item}
              <span className="ml-6 opacity-30">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
