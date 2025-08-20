const express = require('express');
const Ticket = require('../models/Ticket');
const triagePlanner = require('../agent/triagePlanner');
const auditLogger = require('../agent/auditLogger');
const auth = require('../middleware/auth');
const { validate, ticketSchema, replySchema } = require('../middleware/validation');
const { mutationLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { status, my } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (my === 'true') filter.createdBy = req.user.userId;
    
    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .populate('agentSuggestionId')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, mutationLimiter, validate(ticketSchema), async (req, res) => {
  try {
    // Only users can create tickets
    if (req.user.role !== 'user') {
      return res.status(403).json({ error: 'Only users can create tickets' });
    }
    
    const ticket = new Ticket({ ...req.body, createdBy: req.user.userId });
    await ticket.save();
    
    // Log ticket creation
    const traceId = auditLogger.generateTraceId();
    await auditLogger.log(ticket._id, traceId, 'user', 'TICKET_CREATED', {
      title: ticket.title,
      category: ticket.category
    });
    
    // Trigger triage workflow asynchronously
    setImmediate(async () => {
      try {
        await triagePlanner.executeWorkflow(ticket);
      } catch (error) {
        console.error('Triage workflow failed:', error);
      }
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .populate('agentSuggestionId')
      .populate('replies.author', 'name email');
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reply', auth, mutationLimiter, validate(replySchema), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    ticket.replies.push({
      author: req.user.userId,
      content: req.body.content,
      isAgent: req.body.isAgent || false
    });
    
    if (req.body.status) {
      ticket.status = req.body.status;
    }
    
    await ticket.save();
    
    // Log reply
    const traceId = auditLogger.generateTraceId();
    await auditLogger.log(ticket._id, traceId, 'agent', 'REPLY_SENT', {
      replyLength: req.body.content.length,
      newStatus: ticket.status
    });
    
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/assign', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignee: req.body.assigneeId },
      { new: true }
    ).populate('assignee', 'name email');
    
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    const traceId = auditLogger.generateTraceId();
    await auditLogger.log(ticket._id, traceId, 'agent', 'TICKET_ASSIGNED', {
      assigneeId: req.body.assigneeId
    });
    
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/audit', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Only allow access if user created the ticket or is admin/agent
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const auditLogs = await auditLogger.getTicketAudit(req.params.id);
    res.json(auditLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/audit/export', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // Only allow access if user created the ticket or is admin/agent
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const auditLogs = await auditLogger.getTicketAudit(req.params.id);
    
    // Set headers for NDJSON download
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${req.params.id}.ndjson"`);
    
    // Convert to NDJSON format (one JSON object per line)
    const ndjson = auditLogs.map(log => JSON.stringify(log)).join('\n');
    res.send(ndjson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;