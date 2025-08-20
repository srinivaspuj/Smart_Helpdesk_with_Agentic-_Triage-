const AuditLog = require('../models/AuditLog');
const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  generateTraceId() {
    return uuidv4();
  }

  async log(ticketId, traceId, actor, action, meta = {}) {
    try {
      const auditLog = new AuditLog({
        ticketId,
        traceId,
        actor,
        action,
        meta,
        timestamp: new Date()
      });
      
      await auditLog.save();
      console.log(`[AUDIT] ${action} - Ticket: ${ticketId}, Trace: ${traceId}`);
      
      return auditLog;
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  async getTicketAudit(ticketId) {
    return AuditLog.find({ ticketId }).sort({ timestamp: 1 });
  }
}

module.exports = new AuditLogger();