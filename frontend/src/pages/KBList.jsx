import { useState, useEffect } from 'react'
import { kb } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const KBList = () => {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('published')
  const [editingArticle, setEditingArticle] = useState(null)
  const [formData, setFormData] = useState({ title: '', body: '', tags: '', status: 'draft' })
  const { user } = useAuth()

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const params = {}
        if (searchQuery) params.query = searchQuery
        if (user.role === 'admin') params.status = statusFilter
        
        const response = await kb.getAll(params)
        setArticles(response.data)
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchArticles, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, statusFilter, user.role])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
    setLoading(true)
  }

  const handleEdit = (article) => {
    setEditingArticle(article._id)
    setFormData({
      title: article.title,
      body: article.body,
      tags: article.tags.join(', '),
      status: article.status
    })
  }

  const handleSave = async () => {
    try {
      const articleData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
      
      if (editingArticle) {
        await kb.update(editingArticle, articleData)
      } else {
        await kb.create(articleData)
      }
      
      setEditingArticle(null)
      setFormData({ title: '', body: '', tags: '', status: 'draft' })
      
      // Refresh articles
      const params = {}
      if (user.role === 'admin') params.status = statusFilter
      const response = await kb.getAll(params)
      setArticles(response.data)
    } catch (error) {
      console.error('Failed to save article:', error)
      alert('Failed to save article: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    
    try {
      await kb.delete(id)
      setArticles(articles.filter(article => article._id !== id))
    } catch (error) {
      console.error('Failed to delete article:', error)
      alert('Failed to delete article: ' + (error.response?.data?.error || error.message))
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Knowledge Base</h2>
        {user.role === 'admin' && (
          <button 
            onClick={() => {
              setEditingArticle('new')
              setFormData({ title: '', body: '', tags: '', status: 'draft' })
            }}
            style={{ padding: '0.5rem 1rem', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Create Article
          </button>
        )}
      </div>
      
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={handleSearch}
          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        
        {user.role === 'admin' && (
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="all">All</option>
          </select>
        )}
      </div>

      {/* Article Form */}
      {editingArticle && (
        <div style={{ border: '2px solid #3498db', padding: '1rem', marginBottom: '2rem', borderRadius: '4px', background: '#f8f9fa' }}>
          <h3>{editingArticle === 'new' ? 'Create New Article' : 'Edit Article'}</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Body</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({...formData, body: e.target.value})}
              rows={6}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({...formData, tags: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="e.g. password, authentication, login"
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleSave}
              style={{ padding: '0.5rem 1rem', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Save
            </button>
            <button 
              onClick={() => setEditingArticle(null)}
              style={{ padding: '0.5rem 1rem', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Articles List */}
      <div>
        {articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            {searchQuery ? 'No articles found matching your search.' : 'No articles available.'}
          </div>
        ) : (
          articles.map(article => (
            <div key={article._id} style={{ border: '1px solid #ddd', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{article.title}</h3>
                  <p style={{ color: '#666', margin: '0.5rem 0' }}>{article.body.substring(0, 200)}...</p>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    {article.tags?.map(tag => (
                      <span key={tag} style={{ 
                        background: '#ecf0f1', 
                        padding: '0.2rem 0.5rem', 
                        margin: '0.2rem 0.2rem 0.2rem 0', 
                        borderRadius: '3px',
                        fontSize: '0.8rem'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '3px',
                      background: article.status === 'published' ? '#d4edda' : '#fff3cd',
                      color: article.status === 'published' ? '#155724' : '#856404'
                    }}>
                      {article.status.toUpperCase()}
                    </span>
                    <span style={{ marginLeft: '1rem' }}>By: {article.author?.name}</span>
                    <span style={{ marginLeft: '1rem' }}>Updated: {new Date(article.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {user.role === 'admin' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button 
                      onClick={() => handleEdit(article)}
                      style={{ padding: '0.3rem 0.6rem', background: '#f39c12', color: 'white', border: 'none', borderRadius: '3px', fontSize: '0.8rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(article._id)}
                      style={{ padding: '0.3rem 0.6rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', fontSize: '0.8rem' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default KBList