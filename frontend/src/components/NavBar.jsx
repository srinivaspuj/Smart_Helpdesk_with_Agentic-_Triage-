import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NavBar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const linkStyle = (path) => ({
    marginRight: '1.5rem',
    padding: '0.5rem 1rem',
    textDecoration: 'none',
    borderRadius: '6px',
    color: isActive(path) ? 'white' : '#4a5568',
    background: isActive(path) ? '#667eea' : 'transparent',
    transition: 'all 0.2s',
    fontWeight: '500'
  })

  return (
    <nav style={{ 
      padding: '1rem 2rem', 
      background: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      borderBottom: '1px solid #e1e5e9'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginRight: '2rem',
          textDecoration: 'none',
          color: '#2c3e50'
        }}>
          Smart Helpdesk
        </Link>
        
        {user && (
          <>
            <Link to="/tickets" style={linkStyle('/tickets')}>Tickets</Link>
            <Link to="/kb" style={linkStyle('/kb')}>Knowledge Base</Link>
            {(user.role === 'admin' || user.role === 'agent') && (
              <Link to="/settings" style={linkStyle('/settings')}>Settings</Link>
            )}
          </>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user ? (
          <>
            <span style={{ 
              marginRight: '1rem', 
              padding: '0.25rem 0.75rem',
              background: user.role === 'admin' ? '#e74c3c' : user.role === 'agent' ? '#f39c12' : '#27ae60',
              color: 'white',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {user.role}
            </span>
            <span style={{ marginRight: '1.5rem', color: '#4a5568', fontWeight: '500' }}>{user.name}</span>
            <button 
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                background: '#718096',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle('/login')}>Login</Link>
            <Link to="/register" style={linkStyle('/register')}>Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default NavBar