const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/patients
// @desc    Get all patients (Doctor only)
// @access  Private (Doctor only)
router.get('/', restrictTo('doctor'), async (req, res) => {
  try {
    const patients = await Patient.find().sort('-createdAt');
    res.json({ status: 'success', count: patients.length, data: patients });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Error fetching patients' });
  }
});
// @desc    Get current patient profile
// @access  Private (Patient only)
router.get('/me', restrictTo('patient'), async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    res.json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching patient profile'
    });
  }
});

// @route   PUT /api/patients/me
// @desc    Update current patient profile
// @access  Private (Patient only)
router.put('/me', restrictTo('patient'), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'dateOfBirth', 'gender', 'bloodGroup', 'address', 'emergencyContact'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating patient profile'
    });
  }
});

// @route   POST /api/patients/me/medical-history
// @desc    Add medical history entry
// @access  Private (Patient only)
router.post('/me/medical-history', restrictTo('patient'), async (req, res) => {
  try {
    const { condition, diagnosedDate, notes } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    patient.medicalHistory.push({ condition, diagnosedDate, notes });
    await patient.save();

    res.json({
      status: 'success',
      message: 'Medical history added successfully',
      data: patient.medicalHistory
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error adding medical history'
    });
  }
});

// @route   POST /api/patients/me/documents
// @desc    Add document
// @access  Private (Patient only)
router.post('/me/documents', restrictTo('patient'), async (req, res) => {
  try {
    const { type, title, url } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    patient.documents.push({ type, title, url });
    await patient.save();

    res.json({
      status: 'success',
      message: 'Document added successfully',
      data: patient.documents
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error adding document'
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID (for doctors)
// @access  Private (Doctor only)
router.get('/:id', restrictTo('doctor'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userId', 'email');
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.json({
      status: 'success',
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching patient'
    });
  }
});

module.exports = router;
