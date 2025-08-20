import { useState, useEffect } from 'react'
import { config } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const Settings = () => {
  const [settings, setSettings] = useState({
    autoCloseEnabled: false,
    confidenceThreshold: 0.8,
    slaHours: 24
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await config.get()
        setSettings(response.data)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      await config.update(settings)
      setMessage('Settings saved successfully!')
    } catch (error) {
      setMessage('Failed to save settings: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Settings</h2>
      
      {user.role === 'admin' ? (
        <div style={{ maxWidth: '500px' }}>
          {message && (
            <div style={{ 
              padding: '0.5rem', 
              marginBottom: '1rem', 
              borderRadius: '4px',
              background: message.includes('success') ? '#d4edda' : '#f8d7da',
              color: message.includes('success') ? '#155724' : '#721c24',
              border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {message}
            </div>
          )}
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={settings.autoCloseEnabled}
                onChange={(e) => handleChange('autoCloseEnabled', e.target.checked)}
              />
              <span>Enable auto-close for high confidence suggestions</span>
            </label>
            <small style={{ color: '#666', marginLeft: '1.5rem' }}>
              When enabled, tickets with AI confidence above the threshold will be automatically resolved
            </small>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Confidence Threshold: {(settings.confidenceThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.confidenceThreshold}
              onChange={(e) => handleChange('confidenceThreshold', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666' }}>
              Minimum confidence level required for auto-closing tickets
            </small>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              SLA Hours
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.slaHours}
              onChange={(e) => handleChange('slaHours', parseInt(e.target.value))}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', width: '100px' }}
            />
            <small style={{ color: '#666', marginLeft: '0.5rem' }}>
              Hours before a ticket is considered overdue
            </small>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ 
              padding: '0.75rem 1.5rem', 
              background: saving ? '#bdc3c7' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <h3>Access Restricted</h3>
          <p>Only administrators can modify system settings.</p>
        </div>
      )}
    </div>
  )
}

export default Settings