import { Link } from 'react-router-dom'
import { t } from '../i18n/index.js'

const DIVISIONS = ['diamant', 'or', 'plata']

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
          {DIVISIONS.map(div => (
            <Link
              key={div}
              to={`/bracket/${div}`}
              className="bg-surface border border-gray-100 rounded-xl p-6 text-center shadow-sm hover:shadow-md hover:border-accent transition-all"
            >
              <div className="text-4xl mb-2">{div === 'diamant' ? '💎' : div === 'or' ? '🥇' : '🥈'}</div>
              <div className="font-bold text-primary text-lg">{t(`divisions.${div}`)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
