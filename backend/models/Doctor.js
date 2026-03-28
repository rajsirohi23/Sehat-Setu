const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Medical license number is required'],
    unique: true
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    enum: ['general', 'cardiology', 'dermatology', 'neurology', 'orthopedics', 'pediatrics', 'psychiatry', 'surgery']
  },
  experience: {
    type: Number,
    default: 0
  },
  qualifications: [String],
  hospitalAffiliation: {
    name: String,
    address: String
  },
  clinicAddress: {
    type: String,
    trim: true
  },
  consultationFee: {
    type: Number,
    default: 0
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalConsultations: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
