const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  last_refreshed_at: { type: Date, default: null }
});

module.exports = mongoose.model('Status', StatusSchema);
