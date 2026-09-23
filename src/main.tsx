import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Hash routing keeps every shareable URL at a 200 status on any static
        host (GitHub Pages project sites have no rewrite rules, so path-based
        deep links would otherwise 404). Guests share links like
        /#invite/<slug>... i.e. /#/invite/<slug>, which always resolves. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
