// Single source of truth for division display config.
// DB values ('diamant', 'or', 'plata') are keys — never change those.
// Labels here are Spanish; swap fullLabel via i18n when Catalan is added.

export const DIVISION_CONFIG = {
  diamant: {
    label:     'Diamante',
    fullLabel: 'División Diamante',
    icon:      '💎',
    color:     '#0433FF',
    gradient:  'from-[#0032a0] to-[#0433FF]',
  },
  or: {
    label:     'Oro',
    fullLabel: 'División Oro',
    icon:      '🥇',
    color:     '#ff8000',
    gradient:  'from-[#0032a0] to-[#ff8000]',
  },
  plata: {
    label:     'Plata',
    fullLabel: 'División Plata',
    icon:      '🥈',
    color:     '#94a3b8',
    gradient:  'from-[#0032a0] to-[#94a3b8]',
  },
}

export const DIVISIONS = ['diamant', 'or', 'plata']
