import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(10,22,40,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,212,255,0.3)',
            color: '#e2eaf4',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.8rem',
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#020408' } },
          error:   { iconTheme: { primary: '#ff6b35', secondary: '#020408' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
