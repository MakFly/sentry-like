import { init } from '@errorwatch/sdk/react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Initialize ErrorWatch SDK with transport config
init({
  dsn: 'http://localhost:3333',
  apiKey: import.meta.env.VITE_API_KEY || 'ew_live_YOUR_KEY',
  environment: 'development',
  replay: {
    enabled: true,
    replaysOnErrorSampleRate: 1.0,
  },
  transport: {
    maxRetries: 3,
    onError: (error) => {
      console.log('%c SDK Error ', 'background: red; color: white', error.code, error.message)
      if (error.code === 'INGESTION_DISABLED') {
        alert('Error monitoring is disabled for this project!')
      }
    },
    onSuccess: () => {
      console.log('%c Error sent ', 'background: green; color: white')
    }
  }
})

console.log('ErrorWatch SDK initialized')

createRoot(document.getElementById('root')!).render(<App />)
