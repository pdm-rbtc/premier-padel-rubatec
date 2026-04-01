// Single source of truth for division display config.
// DB values ('diamant', 'or', 'plata') are keys — never change those.
// Labels here are Spanish; swap fullLabel via i18n when Catalan is added.

export const DIVISION_CONFIG = {
  diamant: {
    label:     'Diamante',
    fullLabel: 'División Diamante',
    icon:      '💎',
    gradient:  'from-[#001d72] to-[#0433FF]',
  },
  or: {
    label:     'Oro',
    fullLabel: 'División Oro',
    icon:      '🥇',
    gradient:  'from-yellow-600 to-yellow-400',
  },
  plata: {
    label:     'Plata',
    fullLabel: 'División Plata',
    icon:      '🥈',
    gradient:  'from-slate-500 to-slate-300',
  },
}

export const DIVISIONS = ['diamant', 'or', 'plata']
