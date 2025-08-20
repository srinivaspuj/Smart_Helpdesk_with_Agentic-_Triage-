const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  autoCloseEnabled: { type: Boolean, default: false },
  confidenceThreshold: { type: Number, min: 0, max: 1, default: 0.8 },
  slaHours: { type: Number, default: 24 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Config', configSchema);