const llmProvider = require('./llmProvider');
const kbSearch = require('./kbSearch');
const auditLogger = require('./auditLogger');
const AgentSuggestion = require('../models/AgentSuggestion');
const Ticket = require('../models/Ticket');
const Config = require('../models/Config');

class TriagePlanner {
  async executeWorkflow(ticket) {
    // Idempotency check - prevent duplicate triage
    const existingSuggestion = await AgentSuggestion.findOne({ ticketId: ticket._id });
    if (existingSuggestion) {
      console.log(`Triage already completed for ticket ${ticket._id}`);
      return existingSuggestion;
    }
    
    const traceId = auditLogger.generateTraceId();
    const startTime = Date.now();
    
    try {
      // Step 1: Plan
      await auditLogger.log(ticket._id, traceId, 'system', 'TRIAGE_STARTED', { ticketId: ticket._id });
      
      // Step 2: Classify
      const classification = await this.classify(ticket, traceId);
      
      // Step 3: Retrieve KB articles
      const articles = await this.retrieveKB(ticket, classification.predictedCategory, traceId);
      
      // Step 4: Draft reply
      const draft = await this.draftReply(ticket, articles, traceId);
      
      // Step 5: Create suggestion
      const suggestion = await this.createSuggestion(ticket, classification, articles, draft, startTime, traceId);
      
      // Step 6: Make decision
      await this.makeDecision(ticket, suggestion, traceId);
      
      return suggestion;
    } catch (error) {
      await auditLogger.log(ticket._id, traceId, 'system', 'TRIAGE_FAILED', { error: error.message });
      throw error;
    }
  }

  async classify(ticket, traceId) {
    const text = `${ticket.title} ${ticket.description}`;
    const result = await llmProvider.classify(text);
    
    await auditLogger.log(ticket._id, traceId, 'system', 'AGENT_CLASSIFIED', {
      predictedCategory: result.predictedCategory,
      confidence: result.confidence
    });
    
    return result;
  }

  async retrieveKB(ticket, category, traceId) {
    const query = `${ticket.title} ${ticket.description}`;
    const articles = await kbSearch.search(query, category, 3);
    
    await auditLogger.log(ticket._id, traceId, 'system', 'KB_RETRIEVED', {
      query,
      articlesFound: articles.length,
      articleIds: articles.map(a => a._id)
    });
    
    return articles;
  }

  async draftReply(ticket, articles, traceId) {
    const text = `${ticket.title} ${ticket.description}`;
    const result = await llmProvider.draft(text, articles);
    
    await auditLogger.log(ticket._id, traceId, 'system', 'DRAFT_GENERATED', {
      draftLength: result.draftReply.length,
      citationsCount: result.citations.length
    });
    
    return result;
  }

  async createSuggestion(ticket, classification, articles, draft, startTime, traceId) {
    const suggestion = new AgentSuggestion({
      ticketId: ticket._id,
      predictedCategory: classification.predictedCategory,
      articleIds: articles.map(a => a._id.toString()),
      draftReply: draft.draftReply,
      confidence: classification.confidence,
      modelInfo: {
        provider: 'stub',
        model: 'deterministic-v1',
        promptVersion: '1.0',
        latencyMs: Date.now() - startTime
      }
    });
    
    await suggestion.save();
    return suggestion;
  }

  async makeDecision(ticket, suggestion, traceId) {
    const config = await Config.findOne() || { autoCloseEnabled: false, confidenceThreshold: 0.8 };
    
    if (config.autoCloseEnabled && suggestion.confidence >= config.confidenceThreshold) {
      // Auto-close the ticket
      suggestion.autoClosed = true;
      await suggestion.save();
      
      // Add agent reply
      ticket.replies.push({
        content: suggestion.draftReply,
        isAgent: true,
        createdAt: new Date()
      });
      
      ticket.status = 'resolved';
      ticket.agentSuggestionId = suggestion._id;
      await ticket.save();
      
      await auditLogger.log(ticket._id, traceId, 'system', 'AUTO_CLOSED', {
        confidence: suggestion.confidence,
        threshold: config.confidenceThreshold
      });
    } else {
      // Assign to human
      ticket.status = 'waiting_human';
      ticket.agentSuggestionId = suggestion._id;
      await ticket.save();
      
      await auditLogger.log(ticket._id, traceId, 'system', 'ASSIGNED_TO_HUMAN', {
        confidence: suggestion.confidence,
        threshold: config.confidenceThreshold
      });
    }
  }
}

module.exports = new TriagePlanner();