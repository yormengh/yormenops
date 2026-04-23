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
            background: '#1c1c28',
            border: '1px solid rgba(197,160,80,0.2)',
            color: '#ede8df',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.02em',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
          },
          success: { iconTheme: { primary: '#c5a050', secondary: '#1c1c28' } },
          error:   { iconTheme: { primary: '#c96060', secondary: '#1c1c28' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
