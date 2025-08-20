import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tickets } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const TicketList = () => {
  const [ticketList, setTicketList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', my: false })
  const { user } = useAuth()

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const params = {}
        if (filter.status) params.status = filter.status
        if (filter.my) params.my = 'true'
        
        const response = await tickets.getAll(params)
        setTicketList(response.data)
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [filter])

  const getStatusColor = (status) => {
    const colors = {
      open: '#f39c12',
      triaged: '#3498db',
      waiting_human: '#e74c3c',
      resolved: '#27ae60',
      closed: '#95a5a6'
    }
    return colors[status] || '#95a5a6'
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#2d3748', fontSize: '1.875rem', fontWeight: '700' }}>Support Tickets</h2>
        {user.role === 'user' && (
          <Link to="/tickets/new" style={{ 
            padding: '0.75rem 1.5rem', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            + New Ticket
          </Link>
        )}
      </div>
      
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        gap: '1rem',
        background: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <select 
          value={filter.status} 
          onChange={(e) => setFilter({...filter, status: e.target.value})}
          style={{ 
            padding: '0.5rem 1rem', 
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            background: 'white',
            color: '#4a5568'
          }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="triaged">Triaged</option>
          <option value="waiting_human">Waiting Human</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: '#4a5568',
          fontWeight: '500'
        }}>
          <input 
            type="checkbox" 
            checked={filter.my}
            onChange={(e) => setFilter({...filter, my: e.target.checked})}
          />
          My Tickets
        </label>
      </div>
      
      <div>
        {ticketList.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            background: 'white',
            borderRadius: '12px',
            color: '#718096'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
            <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>No tickets found</h3>
            <p>Create your first support ticket to get started</p>
          </div>
        ) : (
          ticketList.map(ticket => (
            <div key={ticket._id} style={{ 
              background: 'white', 
              padding: '1.5rem', 
              margin: '1rem 0', 
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <h3 style={{ margin: '0 0 0.75rem 0' }}>
                <Link to={`/tickets/${ticket._id}`} style={{ 
                  textDecoration: 'none', 
                  color: '#2d3748',
                  fontSize: '1.125rem',
                  fontWeight: '600'
                }}>
                  {ticket.title}
                </Link>
              </h3>
              <p style={{ color: '#718096', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                {ticket.description.substring(0, 150)}...
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  background: getStatusColor(ticket.status), 
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.75rem'
                }}>
                  {ticket.status.replace('_', ' ').toUpperCase()}
                </span>
                {ticket.category && (
                  <span style={{ 
                    padding: '0.25rem 0.75rem', 
                    background: '#edf2f7', 
                    borderRadius: '20px',
                    color: '#4a5568',
                    fontWeight: '500',
                    fontSize: '0.75rem'
                  }}>
                    {ticket.category.toUpperCase()}
                  </span>
                )}
                <span style={{ color: '#718096' }}>{ticket.createdBy?.name}</span>
                <span style={{ color: '#a0aec0' }}>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TicketList