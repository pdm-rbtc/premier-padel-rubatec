import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './i18n/index.jsx'
import { DevModeProvider } from './contexts/DevMode.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <DevModeProvider>
        <BrowserRouter basename="/premier-padel-rubatec">
          <App />
        </BrowserRouter>
      </DevModeProvider>
    </LanguageProvider>
  </React.StrictMode>,
)
