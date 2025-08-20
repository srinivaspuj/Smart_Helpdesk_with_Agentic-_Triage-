import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { tickets, agent } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const TicketDetail = () => {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [showAudit, setShowAudit] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketResponse = await tickets.getById(id)
        setTicket(ticketResponse.data)
        
        // Try to get existing suggestion
        try {
          const suggestionResponse = await agent.getSuggestion(id)
          setSuggestion(suggestionResponse.data)
        } catch (error) {
          // No suggestion exists yet
        }
        
        // Get audit logs
        try {
          const auditResponse = await tickets.getAudit(id)
          setAuditLogs(auditResponse.data)
        } catch (error) {
          console.error('Failed to fetch audit logs:', error)
        }
      } catch (error) {
        console.error('Failed to fetch ticket:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id])

  const handleTriage = async () => {
    try {
      const response = await agent.triage(id)
      setSuggestion(response.data)
      // Refresh ticket to see updated status
      const ticketResponse = await tickets.getById(id)
      setTicket(ticketResponse.data)
      // Refresh audit logs
      const auditResponse = await tickets.getAudit(id)
      setAuditLogs(auditResponse.data)
    } catch (error) {
      console.error('Triage failed:', error)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    
    try {
      await tickets.reply(id, {
        content: replyText,
        isAgent: user.role === 'agent' || user.role === 'admin',
        status: 'resolved' // You could make this configurable
      })
      
      setReplyText('')
      // Refresh ticket
      const ticketResponse = await tickets.getById(id)
      setTicket(ticketResponse.data)
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

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
  if (!ticket) return <div>Ticket not found</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2>{ticket.title}</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ 
            padding: '0.3rem 0.6rem', 
            borderRadius: '4px', 
            background: getStatusColor(ticket.status), 
            color: 'white',
            fontSize: '0.9rem'
          }}>
            {ticket.status.replace('_', ' ').toUpperCase()}
          </span>
          {ticket.category && (
            <span style={{ padding: '0.3rem 0.6rem', background: '#ecf0f1', borderRadius: '4px', fontSize: '0.9rem' }}>
              {ticket.category}
            </span>
          )}
        </div>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          <p>Created by: {ticket.createdBy?.name} on {new Date(ticket.createdAt).toLocaleString()}</p>
          {ticket.assignee && <p>Assigned to: {ticket.assignee.name}</p>}
        </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
        <h4>Description</h4>
        <p>{ticket.description}</p>
      </div>

      {/* Conversation Thread */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Conversation</h3>
        {ticket.replies && ticket.replies.length > 0 ? (
          ticket.replies.map((reply, index) => (
            <div key={index} style={{ 
              border: '1px solid #ddd', 
              padding: '1rem', 
              margin: '1rem 0', 
              borderRadius: '4px',
              background: reply.isAgent ? '#e8f4fd' : '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong>{reply.author?.name || 'System'} {reply.isAgent && '(Agent)'}</strong>
                <small>{new Date(reply.createdAt).toLocaleString()}</small>
              </div>
              <p>{reply.content}</p>
            </div>
          ))
        ) : (
          <p style={{ color: '#666' }}>No replies yet</p>
        )}
      </div>

      {/* Agent Suggestion */}
      {suggestion && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>AI Suggestion</h3>
          <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '4px', background: '#f0f8ff' }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Predicted Category:</strong> {suggestion.predictedCategory}
              <span style={{ marginLeft: '1rem' }}>
                <strong>Confidence:</strong> {(suggestion.confidence * 100).toFixed(1)}%
              </span>
              {suggestion.autoClosed && (
                <span style={{ marginLeft: '1rem', color: '#27ae60' }}>
                  <strong>Auto-closed</strong>
                </span>
              )}
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Draft Reply:</strong>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                {suggestion.draftReply}
              </div>
            </div>
            {suggestion.articles && suggestion.articles.length > 0 && (
              <div>
                <strong>Referenced Articles:</strong>
                <ul style={{ marginTop: '0.5rem' }}>
                  {suggestion.articles.map(article => (
                    <li key={article._id}>{article.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {!suggestion && (
          <button 
            onClick={handleTriage} 
            style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Get AI Suggestions
          </button>
        )}
        
        <button 
          onClick={() => setShowAudit(!showAudit)}
          style={{ padding: '0.5rem 1rem', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {showAudit ? 'Hide' : 'Show'} Audit Trail
        </button>
      </div>

      {/* Reply Form */}
      {(user.role === 'agent' || user.role === 'admin') && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Send Reply</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            style={{ width: '100%', minHeight: '100px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <button 
            onClick={handleReply}
            style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Send Reply
          </button>
        </div>
      )}

      {/* Audit Trail */}
      {showAudit && (
        <div>
          <h3>Audit Trail</h3>
          {auditLogs.length > 0 ? (
            auditLogs.map((log, index) => (
              <div key={index} style={{ border: '1px solid #ddd', padding: '0.5rem', margin: '0.5rem 0', borderRadius: '4px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>{log.action}</strong> by {log.actor}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                {log.traceId && <div style={{ color: '#666', fontSize: '0.8rem' }}>Trace: {log.traceId}</div>}
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>
                    {JSON.stringify(log.meta, null, 2)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: '#666' }}>No audit logs available</p>
          )}
        </div>
      )}
    </div>
  )
}

export default TicketDetail