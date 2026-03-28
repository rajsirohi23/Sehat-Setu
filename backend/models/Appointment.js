const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    default: 'video'
  },
  reason: {
    type: String,
    required: true
  },
  symptoms: [String],
  notes: String,
  prescription: {
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      duration: String
    }],
    instructions: String,
    followUpDate: Date
  },
  diagnosis: String,
  consultationNotes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
