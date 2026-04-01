import { useBracket } from '../hooks/useBracket.js'
import { KNOCKOUT_STRUCTURE } from '../lib/dummy.js'
import Spinner from './Spinner.jsx'

// ── Label helpers ─────────────────────────────────────────────────────────────

const ROUND_ABBREV = {
  quarter:     'Cuartos',
  semi:        'Semis',
  final:       'Final',
  third_place: null,        // merged into Final column
  consolation: 'Cuadro B',
}

function matchLabel(round, position) {
  if (round === 'quarter')     return `A${position}`
  if (round === 'semi')        return `S${position}`
  if (round === 'final')       return 'Final'
  if (round === 'third_place') return '3º/4º'
  if (round === 'consolation') return `C${position}`
  return `${position}`
}

// ── Build display structure from flat match rows ───────────────────────────────
// Returns { columns: [{ heading, matches }], consolation: [match] }

function buildStructure(matches) {
  const byRound = {}
  for (const m of matches) {
    ;(byRound[m.round] ??= []).push(m)
  }

  // Main bracket columns — quarter and/or semi, then final+third_place together
  const COLUMN_ROUNDS = ['quarter', 'semi']
  const columns = []

  for (const round of COLUMN_ROUNDS) {
    if (byRound[round]) {
      columns.push({ heading: ROUND_ABBREV[round], matches: byRound[round] })
    }
  }

  // Final column: final first, then third_place
  const finalMatches = [
    ...(byRound['final'] ?? []),
    ...(byRound['third_place'] ?? []),
  ]
  if (finalMatches.length) {
    columns.push({ heading: 'Final', matches: finalMatches })
  }

  return { columns, consolation: byRound['consolation'] ?? [] }
}

// ── Match slot card ───────────────────────────────────────────────────────────

function MatchSlot({ match, isFinal }) {
  const teamA   = match.couple_a?.team_name ?? (match.couple_a_id ? '…' : 'Por determinar')
  const teamB   = match.couple_b?.team_name ?? (match.couple_b_id ? '…' : 'Por determinar')
  const winnerA = match.winner_id && match.winner_id === match.couple_a_id
  const winnerB = match.winner_id && match.winner_id === match.couple_b_id
  const tbd     = !match.couple_a_id && !match.couple_b_id
  const label   = matchLabel(match.round, match.position)

  return (
    <div className={`bg-surface border rounded-xl shadow-sm p-3 w-44
      ${isFinal ? 'border-accent/50' : 'border-gray-100'}`}>
      <div className="text-xs font-semibold text-text-secondary mb-2">{label}</div>
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
    </div>
  )
}

// ── Dummy fallback slot (pre-bracket generation) ──────────────────────────────

function DummySlot({ slot }) {
  return (
    <div className="bg-surface border border-gray-100 rounded-xl shadow-sm p-3 w-44 opacity-60">
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

  // No bracket in DB yet — show dummy structure as placeholder
  if (!loading && matches.length === 0) {
    const structure = KNOCKOUT_STRUCTURE[division]
    if (!structure) return null
    return (
      <div className="space-y-8">
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <p className="text-xs text-text-secondary mb-2 sm:hidden">← Desliza para ver el cuadro completo →</p>
          <div className="flex gap-8 min-w-max items-start">
            {structure.main.map(({ round, slots }) => (
              <div key={round} className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-center">
                  {round}
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
              Cuadro B
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

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-text-secondary text-sm">
        <Spinner size="sm" />
        <span>Cargando cuadro…</span>
      </div>
    )
  }

  const { columns, consolation } = buildStructure(matches)

  return (
    <div className="space-y-8">
      {/* Main bracket */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <p className="text-xs text-text-secondary mb-2 sm:hidden">← Desliza para ver el cuadro completo →</p>
        <div className="flex gap-8 min-w-max items-start">
          {columns.map(({ heading, matches: colMatches }) => (
            <div key={heading} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-center">
                {heading}
              </h3>
              {colMatches.map(m => (
                <MatchSlot key={m.id} match={m} isFinal={m.round === 'final'} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Consolation matches */}
      {consolation.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <span className="w-3 h-px bg-gray-300 inline-block" />
            Cuadro B
            <span className="flex-1 h-px bg-gray-100 inline-block" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {consolation.map(m => <MatchSlot key={m.id} match={m} isFinal={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}
