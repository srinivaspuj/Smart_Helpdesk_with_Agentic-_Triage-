const express = require('express');
const triagePlanner = require('../agent/triagePlanner');
const AgentSuggestion = require('../models/AgentSuggestion');
const Ticket = require('../models/Ticket');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/triage', auth, async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const suggestion = await triagePlanner.executeWorkflow(ticket);
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/suggestion/:ticketId', auth, async (req, res) => {
  try {
    const suggestion = await AgentSuggestion.findOne({ ticketId: req.params.ticketId })
      .sort({ createdAt: -1 });
    
    if (!suggestion) {
      return res.status(404).json({ error: 'No suggestion found' });
    }
    
    // Populate article details
    const Article = require('../models/Article');
    const articles = await Article.find({ _id: { $in: suggestion.articleIds } });
    suggestion.articles = articles;
    
    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;