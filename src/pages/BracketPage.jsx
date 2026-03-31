import { useParams, Link } from 'react-router-dom'
import GroupTable from '../components/GroupTable.jsx'
import BracketView from '../components/BracketView.jsx'
import LiveBadge from '../components/LiveBadge.jsx'
import { useRealtime } from '../hooks/useRealtime.js'
import { getDummyStandings } from '../lib/dummy.js'
import { t } from '../i18n/index.js'

const GROUP_CODES = {
  diamant: ['G1', 'G2', 'G3'],
  or:      ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
  plata:   ['G1', 'G2', 'G3'],
}

const DIVISION_STYLE = {
  diamant: { icon: '💎', bg: 'from-[#001d72] to-[#0433FF]' },
  or:      { icon: '🥇', bg: 'from-yellow-500 to-yellow-400' },
  plata:   { icon: '🥈', bg: 'from-gray-400 to-gray-300' },
}

const VALID_DIVISIONS = ['diamant', 'or', 'plata']

export default function BracketPage() {
  const { division } = useParams()
  const groups = GROUP_CODES[division] ?? []
  const style = DIVISION_STYLE[division]
  const { connected } = useRealtime(
    'matches',
    () => {},   // GroupTable handles its own refetch via useStandings
    division ? `division=eq.${division}` : null,
  )

  if (!VALID_DIVISIONS.includes(division)) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-text-secondary">{t('errors.not_found')}</p>
        <Link to="/" className="text-primary underline text-sm">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Division header */}
      <div className={`bg-gradient-to-r ${style.bg} rounded-2xl px-6 py-5 text-white`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{style.icon}</span>
          <div>
            <h1 className="text-2xl font-bold">{t(`divisions.${division}`)}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-sm opacity-75">{groups.length} grupos · {groups.length * 4} parejas</p>
              <LiveBadge connected={connected} />
            </div>
          </div>
        </div>
      </div>

      {/* Group phase */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          Fase de grupos
          <span className="flex-1 h-px bg-gray-100" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <GroupTable
              key={g}
              division={division}
              groupCode={g}
              standings={getDummyStandings(division, g)}
            />
          ))}
        </div>
      </section>

      {/* Knockout phase */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          Fase eliminatoria
          <span className="flex-1 h-px bg-gray-100" />
        </h2>
        <BracketView division={division} />
      </section>
    </div>
  )
}
