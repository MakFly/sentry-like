import { useState } from 'react'
import { fetchUsers, triggerApiError } from './api'

interface User {
  id: number
  name: string
  email: string
}

export default function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')

  const handleFetchUsers = async () => {
    setLoading(true)
    setStatus('Fetching users...')
    try {
      const data = await fetchUsers()
      setUsers(data)
      setStatus(`Fetched ${data.length} users`)
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : 'Unknown'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerError = () => {
    setStatus('Triggering JS error...')
    throw new Error('Manual error triggered from React app!')
  }

  const handleApiError = async () => {
    setStatus('Triggering API error...')
    try {
      await triggerApiError()
    } catch (e) {
      setStatus(`API Error caught: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  const handleUnhandledRejection = () => {
    setStatus('Triggering unhandled promise rejection...')
    Promise.reject(new Error('Unhandled promise rejection!'))
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>ErrorWatch React Test</h1>
      <p style={{ color: '#666' }}>
        Test the SDK with JSONPlaceholder API calls and manual errors.
      </p>

      <div style={{
        background: '#fff',
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 20
      }}>
        <h3>Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleFetchUsers}
            disabled={loading}
            style={{ background: '#0070f3', color: 'white' }}
          >
            {loading ? 'Loading...' : 'Fetch Users (JSONPlaceholder)'}
          </button>
          <button
            onClick={handleTriggerError}
            style={{ background: '#e00', color: 'white' }}
          >
            Trigger JS Error
          </button>
          <button
            onClick={handleApiError}
            style={{ background: '#f60', color: 'white' }}
          >
            Trigger API Error (404)
          </button>
          <button
            onClick={handleUnhandledRejection}
            style={{ background: '#909', color: 'white' }}
          >
            Unhandled Promise Rejection
          </button>
        </div>

        {status && (
          <p style={{
            marginTop: 15,
            padding: 10,
            background: '#f0f0f0',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 13
          }}>
            {status}
          </p>
        )}
      </div>

      {users.length > 0 && (
        <div style={{
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>Users from JSONPlaceholder</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {users.slice(0, 5).map((u) => (
              <li key={u.id} style={{
                padding: '8px 0',
                borderBottom: '1px solid #eee'
              }}>
                <strong>{u.name}</strong>
                <br />
                <span style={{ color: '#666', fontSize: 13 }}>{u.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{
        marginTop: 30,
        padding: 15,
        background: '#fffde7',
        borderRadius: 8,
        fontSize: 13
      }}>
        <strong>Instructions:</strong>
        <ol style={{ margin: '10px 0', paddingLeft: 20 }}>
          <li>Open browser DevTools (F12) to see SDK logs</li>
          <li>Click buttons to trigger errors</li>
          <li>Go to Dashboard &rarr; Settings &rarr; Data &rarr; Disable "Event Ingestion"</li>
          <li>Trigger an error again - you should see "INGESTION_DISABLED" in console</li>
        </ol>
      </div>
    </div>
  );
}
