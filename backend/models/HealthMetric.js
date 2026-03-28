const mongoose = require('mongoose');

const healthMetricSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['weight', 'bloodPressure', 'heartRate', 'temperature', 'bloodSugar', 'bmi', 'oxygen', 'cholesterol']
  },
  value: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#4facfe'
  },
  notes: {
    type: String
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
healthMetricSchema.index({ userId: 1, recordedAt: -1 });
healthMetricSchema.index({ patientId: 1, type: 1 });

module.exports = mongoose.model('HealthMetric', healthMetricSchema);
