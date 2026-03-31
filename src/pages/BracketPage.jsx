import { useParams } from 'react-router-dom'
import { useMatches } from '../hooks/useMatches.js'
import GroupTable from '../components/GroupTable.jsx'
import BracketView from '../components/BracketView.jsx'
import { t } from '../i18n/index.js'

const GROUP_CODES = {
  diamant: ['G1', 'G2', 'G3'],
  or: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'],
  plata: ['G1', 'G2', 'G3'],
}

export default function BracketPage() {
  const { division } = useParams()
  const { matches } = useMatches({ division })
  const groups = GROUP_CODES[division] ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">{t(`divisions.${division}`)}</h1>
      <section>
        <h2 className="text-lg font-semibold mb-4">Fase de grupos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => <GroupTable key={g} division={division} groupCode={g} />)}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-4">Fase eliminatoria</h2>
        <BracketView division={division} matches={matches} />
      </section>
    </div>
  )
}
