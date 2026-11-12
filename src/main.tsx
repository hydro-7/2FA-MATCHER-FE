import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

type Health = { ok: boolean; databases: Record<string, string> }

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setError('API is not running yet'))
  }, [])

  return (
    <main>
      <p className="eyebrow">Hackathon starter</p>
      <h1>Booking</h1>
      <p className="lede">React + TypeScript + Express, ready for your idea.</p>
      <section>
        <h2>System check</h2>
        {error && <p className="error">{error}</p>}
        {!health && !error && <p>Checking services…</p>}
        {health && Object.entries(health.databases).map(([name, status]) => (
          <div className="status" key={name}>
            <span>{name}</span>
            <strong className={status}>{status}</strong>
          </div>
        ))}
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
