const mongoose = require('mongoose');

const prescriptionRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  patientUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  currentMedications: {
    type: String
  },
  contactMethod: {
    type: String,
    enum: ['email', 'phone', 'sms', 'app'],
    default: 'app'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  doctorNotes: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
prescriptionRequestSchema.index({ patientUserId: 1, status: 1 });
prescriptionRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PrescriptionRequest', prescriptionRequestSchema);
