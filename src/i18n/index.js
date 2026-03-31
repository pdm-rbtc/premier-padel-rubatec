import es from './es.json'

const translations = { es }
let currentLang = 'es'

export function setLanguage(lang) {
  if (translations[lang]) currentLang = lang
}

export function t(key) {
  const keys = key.split('.')
  let value = translations[currentLang]
  for (const k of keys) {
    value = value?.[k]
  }
  return value ?? key
}
