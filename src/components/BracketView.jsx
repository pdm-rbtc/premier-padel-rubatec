import { useBracket } from '../hooks/useBracket.js'
import { KNOCKOUT_STRUCTURE } from '../lib/dummy.js'
import Spinner from './Spinner.jsx'
import { useI18n } from '../i18n/index.jsx'

// ── Layout constants ──────────────────────────────────────────────────────────
const CARD_W   = 176   // px  (Tailwind w-44)
const CARD_H   = 88    // px  approximate rendered height of MatchSlot
const ROW_GAP  = 16    // px  gap between sibling cards in same column
const COL_GAP  = 44    // px  horizontal gap between columns (SVG connectors live here)
const STEP     = CARD_H + ROW_GAP   // vertical increment in first column

function matchLabel(round, position) {
  if (round === 'quarter')     return `A${position}`
  if (round === 'semi')        return `S${position}`
  if (round === 'final')       return 'Final'
  if (round === 'third_place') return '3º/4º'
  if (round === 'consolation') return `C${position}`
  return `${position}`
}

// ── Layout builder ────────────────────────────────────────────────────────────
// Returns column mapping, Y positions per match, feeders map, and helpers.

function buildLayout(matches) {
  const mainMatches = matches.filter(m => m.round !== 'consolation')
  const consolation = matches.filter(m => m.round === 'consolation')
  const hasQuarters = mainMatches.some(m => m.round === 'quarter')

  const colOf = round => {
    if (round === 'quarter')     return 0
    if (round === 'semi')        return hasQuarters ? 1 : 0
    if (round === 'final')       return hasQuarters ? 2 : 1
    if (round === 'third_place') return hasQuarters ? 2 : 1
    return -1
  }

  // Group into columns
  const colMap = {}
  for (const m of mainMatches) {
    const c = colOf(m.round)
    if (c < 0) continue
    ;(colMap[c] ??= []).push(m)
  }
  const numCols = Object.keys(colMap).length

  // Sort each column (final before third_place, otherwise by position)
  for (const col of Object.values(colMap)) {
    col.sort((a, b) => {
      if (a.round === 'third_place') return 1
      if (b.round === 'third_place') return -1
      return a.position - b.position
    })
  }

  // Feeders map: targetId → [feeder matches], sorted couple_a slot first (= top)
  const feeders = {}
  for (const m of mainMatches) {
    if (m.next_match_id) {
      ;(feeders[m.next_match_id] ??= []).push(m)
    }
  }
  for (const list of Object.values(feeders)) {
    list.sort((a, b) =>
      (a.next_match_slot === 'couple_a' ? 0 : 1) -
      (b.next_match_slot === 'couple_a' ? 0 : 1)
    )
  }

  // Calculate Y positions
  const yPos = {}

  // Column 0: evenly spaced
  ;(colMap[0] ?? []).forEach((m, i) => { yPos[m.id] = i * STEP })

  // Subsequent columns: center each match between its two feeders
  for (let c = 1; c < numCols; c++) {
    const finalM = (colMap[c] ?? []).find(m => m.round === 'final')
    const thirdM = (colMap[c] ?? []).find(m => m.round === 'third_place')

    for (const m of (colMap[c] ?? [])) {
      if (m.round === 'third_place') continue

      const fs = (feeders[m.id] ?? []).filter(f => yPos[f.id] != null)
      if (fs.length >= 2) {
        const topCY = yPos[fs[0].id] + CARD_H / 2
        const botCY = yPos[fs[fs.length - 1].id] + CARD_H / 2
        yPos[m.id] = Math.round((topCY + botCY) / 2 - CARD_H / 2)
      } else if (fs.length === 1) {
        yPos[m.id] = yPos[fs[0].id]
      } else {
        yPos[m.id] = 0
      }
    }

    // Third-place: below the final with extra gap
    if (finalM && thirdM && yPos[finalM.id] != null) {
      yPos[thirdM.id] = yPos[finalM.id] + CARD_H + ROW_GAP * 3
    }
  }

  // Total height of the bracket area
  let totalH = 0
  for (const y of Object.values(yPos)) {
    if (y + CARD_H > totalH) totalH = y + CARD_H
  }

  return { colMap, numCols, feeders, yPos, consolation, colOf, mainMatches, totalH }
}

// ── SVG path builder ──────────────────────────────────────────────────────────

function buildPaths(colMap, numCols, feeders, yPos) {
  const paths = []

  for (let c = 0; c < numCols - 1; c++) {
    const nextCol = colMap[c + 1] ?? []
    const fromRX  = c * (CARD_W + COL_GAP) + CARD_W   // right edge of left column
    const toX     = (c + 1) * (CARD_W + COL_GAP)       // left edge of right column
    const midX    = fromRX + COL_GAP / 2

    for (const to of nextCol) {
      if (to.round === 'third_place') continue
      const toY = yPos[to.id]
      if (toY == null) continue
      const toCY = toY + CARD_H / 2

      const fs = (feeders[to.id] ?? []).filter(f => yPos[f.id] != null)
      if (fs.length < 2) continue

      const fCYs  = fs.map(f => yPos[f.id] + CARD_H / 2)
      const topFY = Math.min(...fCYs)
      const botFY = Math.max(...fCYs)

      // Horizontal arm from each feeder right edge to midpoint
      fCYs.forEach((fy, i) =>
        paths.push({ d: `M ${fromRX} ${fy} H ${midX}`, key: `arm-${c}-${i}-${fy}` })
      )
      // Vertical spine connecting feeder arms
      paths.push({ d: `M ${midX} ${topFY} V ${botFY}`, key: `spine-${c}-${to.id}` })
      // Horizontal arm from midpoint to target left edge
      paths.push({ d: `M ${midX} ${toCY} H ${toX}`, key: `out-${to.id}` })
    }
  }

  return paths
}

// ── Match slot card ───────────────────────────────────────────────────────────

function MatchSlot({ match, isFinal, tbd: tbdLabel }) {
  const teamA   = match.couple_a?.team_name ?? (match.couple_a_id ? '…' : tbdLabel)
  const teamB   = match.couple_b?.team_name ?? (match.couple_b_id ? '…' : tbdLabel)
  const winnerA = match.winner_id && match.winner_id === match.couple_a_id
  const winnerB = match.winner_id && match.winner_id === match.couple_b_id
  const tbd     = !match.couple_a_id && !match.couple_b_id
  const label   = matchLabel(match.round, match.position)

  return (
    <div
      className={`bg-surface border rounded-xl shadow-sm p-3
        ${isFinal ? 'border-accent/50' : 'border-gray-100'}`}
      style={{ width: CARD_W, minHeight: CARD_H }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-secondary">{label}</span>
        {match.court && (
          <span className="text-[10px] text-text-secondary bg-gray-100 px-1.5 py-0.5 rounded font-medium">
            {match.court}
          </span>
        )}
      </div>
      <div className={`flex items-center gap-1.5 py-1 border-b border-gray-100
        ${winnerA ? 'font-bold text-primary' : tbd ? 'text-text-secondary italic' : 'text-text-primary'}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${winnerA ? 'bg-primary' : 'bg-gray-200'}`} />
        <span className="text-sm truncate">{teamA}</span>
        {match.score_a && (
          <span className="ml-auto font-mono text-xs text-primary shrink-0">{match.score_a}</span>
        )}
      </div>
      <div className={`flex items-center gap-1.5 py-1
        ${winnerB ? 'font-bold text-primary' : tbd ? 'text-text-secondary italic' : 'text-text-primary'}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${winnerB ? 'bg-primary' : 'bg-gray-200'}`} />
        <span className="text-sm truncate">{teamB}</span>
        {match.score_b && (
          <span className="ml-auto font-mono text-xs text-primary shrink-0">{match.score_b}</span>
        )}
      </div>
      {match.time_slot && (
        <div className="text-[10px] text-text-secondary mt-1.5 truncate">{match.time_slot}</div>
      )}
    </div>
  )
}

// ── Dummy fallback slot ───────────────────────────────────────────────────────

function DummySlot({ slot }) {
  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm p-3 opacity-60"
      style={{ width: CARD_W, minHeight: CARD_H }}>
      <div className="text-xs font-semibold text-text-secondary mb-2">{slot.label}</div>
      <div className="flex items-center gap-1.5 py-1 border-b border-gray-100 text-text-secondary italic">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
        <span className="text-sm truncate">{slot.side_a}</span>
      </div>
      <div className="flex items-center gap-1.5 py-1 text-text-secondary italic">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
        <span className="text-sm truncate">{slot.side_b}</span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BracketView({ division }) {
  const { matches, loading } = useBracket(division)
  const { t } = useI18n()

  const ROUND_HEADING = {
    quarter:     t('brackets.round_quarter'),
    semi:        t('brackets.round_semi'),
    final:       t('brackets.round_final'),
    third_place: t('brackets.round_final'),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-text-secondary text-sm">
        <Spinner size="sm" />
        <span>{t('brackets.loading')}</span>
      </div>
    )
  }

  // No bracket generated yet — show dummy placeholder structure
  if (matches.length === 0) {
    const structure = KNOCKOUT_STRUCTURE[division]
    if (!structure) return null
    return (
      <div className="space-y-8">
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <p className="text-xs text-text-secondary mb-2 sm:hidden">{t('brackets.swipe_hint')}</p>
          <div className="flex gap-8 min-w-max items-start">
            {structure.main.map(({ round, slots }) => (
              <div key={round} className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-center">
                  {ROUND_HEADING[round] ?? round}
                </h3>
                {slots.map(slot => <DummySlot key={slot.label} slot={slot} />)}
              </div>
            ))}
          </div>
        </div>
        {structure.consolation?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-3 h-px bg-gray-300 inline-block" />
              {t('brackets.consolation')}
              <span className="flex-1 h-px bg-gray-100 inline-block" />
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {structure.consolation.map(slot => <DummySlot key={slot.label} slot={slot} />)}
            </div>
          </div>
        )}
      </div>
    )
  }

  const { colMap, numCols, feeders, yPos, consolation, colOf, mainMatches, totalH } =
    buildLayout(matches)

  const headings = Array.from({ length: numCols }, (_, c) => {
    const col = colMap[c] ?? []
    const mainRound = col.find(m => m.round !== 'third_place')?.round ?? col[0]?.round
    return ROUND_HEADING[mainRound] ?? ''
  })

  const totalW  = numCols * CARD_W + (numCols - 1) * COL_GAP
  const svgPaths = buildPaths(colMap, numCols, feeders, yPos)
  const tbdLabel = t('brackets.tbd')

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <p className="text-xs text-text-secondary mb-2 sm:hidden">{t('brackets.swipe_hint')}</p>

        {/* Column headings */}
        <div style={{ display: 'flex', marginBottom: 10, width: totalW }}>
          {headings.map((h, c) => (
            <div key={c} style={{
              width: CARD_W,
              marginRight: c < numCols - 1 ? COL_GAP : 0,
              textAlign: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {h}
            </div>
          ))}
        </div>

        {/* Bracket area — absolutely positioned cards + SVG overlay */}
        <div style={{ position: 'relative', width: totalW, height: totalH + 8 }}>
          <svg
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none', overflow: 'visible',
            }}
          >
            {svgPaths.map(({ d, key }) => (
              <path key={key} d={d} fill="none" stroke="#e2e8f0" strokeWidth={1.5} strokeLinecap="round" />
            ))}
          </svg>

          {mainMatches.map(m => {
            const c = colOf(m.round)
            const y = yPos[m.id]
            if (c < 0 || y == null) return null
            return (
              <div
                key={m.id}
                style={{ position: 'absolute', left: c * (CARD_W + COL_GAP), top: y }}
              >
                <MatchSlot match={m} isFinal={m.round === 'final'} tbd={tbdLabel} />
              </div>
            )
          })}
        </div>
      </div>

      {consolation.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <span className="w-3 h-px bg-gray-300 inline-block" />
            {t('brackets.consolation')}
            <span className="flex-1 h-px bg-gray-100 inline-block" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {consolation.map(m => <MatchSlot key={m.id} match={m} isFinal={false} tbd={tbdLabel} />)}
          </div>
        </div>
      )}
    </div>
  )
}
