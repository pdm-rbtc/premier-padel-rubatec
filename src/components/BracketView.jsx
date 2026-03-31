export default function BracketView({ division, matches }) {
  const rounds = ['quarter', 'semi', 'third_place', 'final']
  const byRound = round => matches.filter(m => m.round === round && m.phase === 'knockout')

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max py-4">
        {rounds.map(round => (
          <div key={round} className="flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide text-center">
              {round.replace('_', ' ')}
            </h3>
            {byRound(round).map(match => (
              <div key={match.id} className="bg-surface border border-gray-100 rounded-xl shadow-sm p-3 w-48">
                <div className="text-xs text-text-secondary mb-1">{match.time_slot}</div>
                <div className="font-medium text-sm truncate">{match.couple_a?.team_name ?? 'TBD'}</div>
                <div className="font-medium text-sm truncate">{match.couple_b?.team_name ?? 'TBD'}</div>
                {match.score_a && (
                  <div className="mt-1 text-xs font-mono text-primary">{match.score_a} / {match.score_b}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
