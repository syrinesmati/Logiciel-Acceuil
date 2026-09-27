import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { RapportPage } from './screens/Rapport/RapportPage'
import './assets/index.css'

// La page de rapport (phase 6, export PDF) est chargee via une route par hash
// dans une fenetre Electron dediee et invisible, plutot qu'un second point
// d'entree Vite : voir src/main/services/exportPdf.ts.
const estPageRapport = window.location.hash.startsWith('#/rapport')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{estPageRapport ? <RapportPage /> : <App />}</StrictMode>
)
