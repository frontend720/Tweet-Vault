import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AxiosContextProvider } from './AxiosContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <AxiosContextProvider>
    <App />
  </AxiosContextProvider>,
)
