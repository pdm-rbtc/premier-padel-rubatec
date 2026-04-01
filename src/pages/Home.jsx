import { Link } from 'react-router-dom'
import { DIVISION_CONFIG, DIVISIONS } from '../lib/divisions.js'
import { t } from '../i18n/index.js'

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-10 bg-gradient-to-br from-primary to-secondary rounded-2xl text-white">
        <h1 className="text-3xl font-bold">{t('home.title')}</h1>
        <p className="mt-2 text-accent text-lg">{t('home.subtitle')}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">{t('home.divisions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DIVISIONS.map(div => {
            const cfg = DIVISION_CONFIG[div]
            return (
              <Link
                key={div}
                to={`/bracket/${div}`}
                className="bg-surface border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-accent/50 transition-all overflow-hidden group"
              >
                <div className={`bg-gradient-to-r ${cfg.gradient} px-5 py-4 flex items-center gap-3`}>
                  <span className="text-3xl">{cfg.icon}</span>
                  <span className="font-bold text-white text-lg">{cfg.fullLabel}</span>
                </div>
                <div className="px-5 py-3 text-sm text-text-secondary group-hover:text-primary transition-colors">
                  Ver grupos y cuadro eliminatorio →
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
