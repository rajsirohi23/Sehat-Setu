const express = require('express');
const router = express.Router();
const PrescriptionRequest = require('../models/PrescriptionRequest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { protect, restrictTo } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/prescription-requests
// @desc    Create new prescription request
// @access  Private (Patient only)
router.post('/', restrictTo('patient'), async (req, res) => {
  try {
    const { doctorName, reason, details, currentMedications, contactMethod } = req.body;

    // Get patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    // Create prescription request
    const request = await PrescriptionRequest.create({
      patientId: patient._id,
      patientUserId: req.user._id,
      doctorName,
      reason,
      details,
      currentMedications,
      contactMethod: contactMethod || 'app',
      status: 'pending'
    });

    // Populate patient info
    await request.populate('patientId', 'name phone email');

    res.status(201).json({
      status: 'success',
      message: 'Prescription request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Error creating prescription request:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error creating prescription request'
    });
  }
});

// @route   GET /api/prescription-requests
// @desc    Get prescription requests (filtered by user type)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.userType === 'patient') {
      // Patients see only their own requests
      query.patientUserId = req.user._id;
    } else if (req.user.userType === 'doctor') {
      // Doctors see all pending requests
      query.status = 'pending';
    }

    const requests = await PrescriptionRequest.find(query)
      .populate('patientId', 'name phone email bloodGroup dateOfBirth gender')
      .sort('-createdAt');

    res.json({
      status: 'success',
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching prescription requests:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prescription requests'
    });
  }
});

// @route   GET /api/prescription-requests/:id
// @desc    Get prescription request by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const request = await PrescriptionRequest.findById(req.params.id)
      .populate('patientId', 'name phone email bloodGroup dateOfBirth gender medicalHistory allergies')
      .populate('approvedBy', 'name specialty');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Prescription request not found'
      });
    }

    res.json({
      status: 'success',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching prescription request'
    });
  }
});

// @route   PUT /api/prescription-requests/:id/approve
// @desc    Approve prescription request (Doctor only)
// @access  Private (Doctor only)
router.put('/:id/approve', restrictTo('doctor'), async (req, res) => {
  try {
    const { doctorNotes } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    const request = await PrescriptionRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        doctorNotes,
        approvedBy: doctor._id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('patientId', 'name phone email');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Prescription request not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Prescription request approved',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error approving prescription request'
    });
  }
});

// @route   PUT /api/prescription-requests/:id/reject
// @desc    Reject prescription request (Doctor only)
// @access  Private (Doctor only)
router.put('/:id/reject', restrictTo('doctor'), async (req, res) => {
  try {
    const { doctorNotes } = req.body;

    const request = await PrescriptionRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        doctorNotes
      },
      { new: true }
    ).populate('patientId', 'name phone email');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Prescription request not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Prescription request rejected',
      data: request
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error rejecting prescription request'
    });
  }
});

// @route   DELETE /api/prescription-requests/:id
// @desc    Cancel prescription request (Patient only)
// @access  Private (Patient only)
router.delete('/:id', restrictTo('patient'), async (req, res) => {
  try {
    const request = await PrescriptionRequest.findOneAndUpdate(
      { _id: req.params.id, patientUserId: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Prescription request not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Prescription request cancelled'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling prescription request'
    });
  }
});

module.exports = router;
