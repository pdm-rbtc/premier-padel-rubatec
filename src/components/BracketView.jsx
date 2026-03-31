import { KNOCKOUT_STRUCTURE } from '../lib/dummy.js'

function MatchSlot({ slot, highlight }) {
  return (
    <div className={`bg-surface border rounded-xl shadow-sm p-3 w-44
      ${highlight ? 'border-accent/50' : 'border-gray-100'}`}>
      <div className="text-xs font-semibold text-text-secondary mb-2">{slot.label}</div>
      <div className={`flex items-center gap-1.5 py-1 border-b border-gray-100
        ${slot.winner_a ? 'font-bold text-primary' : 'text-text-primary'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
        <span className="text-sm truncate">{slot.team_a ?? slot.side_a}</span>
        {slot.score_a && <span className="ml-auto font-mono text-xs text-primary shrink-0">{slot.score_a}</span>}
      </div>
      <div className={`flex items-center gap-1.5 py-1
        ${slot.winner_b ? 'font-bold text-primary' : 'text-text-primary'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
        <span className="text-sm truncate">{slot.team_b ?? slot.side_b}</span>
        {slot.score_b && <span className="ml-auto font-mono text-xs text-primary shrink-0">{slot.score_b}</span>}
      </div>
    </div>
  )
}

export default function BracketView({ division }) {
  const structure = KNOCKOUT_STRUCTURE[division]
  if (!structure) return null

  return (
    <div className="space-y-8">
      {/* Main bracket */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-8 min-w-max items-start">
          {structure.main.map(({ round, slots }) => (
            <div key={round} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest text-center">
                {round}
              </h3>
              {slots.map(slot => (
                <MatchSlot
                  key={slot.label}
                  slot={slot}
                  highlight={slot.label === 'Final'}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Consolation matches */}
      {structure.consolation?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <span className="w-3 h-px bg-gray-300 inline-block" />
            Cuadro de consolación
            <span className="flex-1 h-px bg-gray-100 inline-block" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {structure.consolation.map(slot => (
              <MatchSlot key={slot.label} slot={slot} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
