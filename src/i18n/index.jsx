import { createContext, useContext, useState } from 'react'
import es from './es.json'
import ca from './ca.json'

const TRANSLATIONS = { es, ca }

function resolve(lang, key) {
  const keys = key.split('.')
  let value = TRANSLATIONS[lang]
  for (const k of keys) value = value?.[k]
  return value ?? key
}

export const LanguageContext = createContext({
  lang: 'es',
  setLang: () => {},
  t: (key) => resolve('es', key),
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const stored = localStorage.getItem('lang')
    return TRANSLATIONS[stored] ? stored : 'es'
  })

  function setLang(l) {
    if (TRANSLATIONS[l]) {
      localStorage.setItem('lang', l)
      setLangState(l)
    }
  }

  const t = (key) => resolve(lang, key)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useI18n() {
  return useContext(LanguageContext)
}
