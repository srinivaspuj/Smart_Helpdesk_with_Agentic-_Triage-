const express = require('express');
const Article = require('../models/Article');
const kbSearch = require('../agent/kbSearch');
const auth = require('../middleware/auth');

const router = express.Router();

// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.get('/', auth, async (req, res) => {
  try {
    const { query, status = 'published' } = req.query;
    
    if (query) {
      // Use search service
      const articles = await kbSearch.search(query, null, 10);
      res.json(articles);
    } else {
      // List all articles
      const filter = status === 'all' ? {} : { status };
      const articles = await Article.find(filter)
        .populate('author', 'name email')
        .sort({ updatedAt: -1 });
      res.json(articles);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const article = new Article({ ...req.body, author: req.user.userId });
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate('author', 'name email');
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('author', 'name email');
    
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;