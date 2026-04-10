import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
// VAULT: bootstrap the local markdown vault before <App /> mounts. If the
// sidecar isn't running this returns false and the app falls back to
// localStorage transparently.
import { bootstrapVault } from './vault/bootstrap.js'

bootstrapVault().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})