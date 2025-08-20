const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  traceId: { type: String, required: true },
  actor: { type: String, enum: ['system', 'agent', 'user'], required: true },
  action: { type: String, required: true },
  meta: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);