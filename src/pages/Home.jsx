import { useSearchParams } from 'react-router-dom'
import GroupTable from '../components/GroupTable.jsx'
import BracketView from '../components/BracketView.jsx'
import { DIVISION_CONFIG, DIVISIONS } from '../lib/divisions.js'
import { getDummyStandings } from '../lib/dummy.js'

const GROUP_CODES = {
  diamant: ['G1', 'G2', 'G3'],
  or:      ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
  plata:   ['G1', 'G2', 'G3'],
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeDiv = DIVISIONS.includes(searchParams.get('div'))
    ? searchParams.get('div')
    : 'diamant'

  const setActiveDiv = (d) => setSearchParams({ div: d }, { replace: true })

  const groups = GROUP_CODES[activeDiv]

  return (
    <div className="space-y-6">
      {/* Tournament header */}
      <div>
        <h1 className="text-xl font-bold text-primary">3r Torneo Premium Pádel Rubatec</h1>
        <p className="text-text-secondary text-sm mt-0.5">
          {DIVISIONS.reduce((t, d) => t + GROUP_CODES[d].length, 0)} grupos ·{' '}
          {DIVISIONS.reduce((t, d) => t + GROUP_CODES[d].length * 4, 0)} parejas · 12 pistas
        </p>
      </div>

      {/* Division tabs */}
      <div className="flex gap-2 flex-wrap">
        {DIVISIONS.map(d => {
          const cfg = DIVISION_CONFIG[d]
          const active = d === activeDiv
          return (
            <button
              key={d}
              onClick={() => setActiveDiv(d)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${active
                  ? `bg-gradient-to-r ${cfg.gradient} text-white shadow-md`
                  : 'bg-surface border border-gray-200 text-text-secondary hover:border-primary/30 hover:text-primary'
                }`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className={`text-xs font-normal ${active ? 'text-white/75' : 'text-text-secondary'}`}>
                {GROUP_CODES[d].length}g · {GROUP_CODES[d].length * 4}p
              </span>
            </button>
          )
        })}
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
              key={`${activeDiv}-${g}`}
              division={activeDiv}
              groupCode={g}
              standings={getDummyStandings(activeDiv, g)}
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
        <BracketView division={activeDiv} />
      </section>
    </div>
  )
}
