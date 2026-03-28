const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { protect, restrictTo } = require('../middleware/auth');

// @route   GET /api/doctors
// @desc    Get all doctors (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { specialty, search } = req.query;
    const query = {};

    if (specialty) {
      query.specialty = specialty;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const doctors = await Doctor.find(query)
      .select('-userId')
      .sort('-rating -totalConsultations');

    res.json({
      status: 'success',
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching doctors'
    });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-userId');
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    res.json({
      status: 'success',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching doctor'
    });
  }
});

// Protected routes
router.use(protect);

// @route   GET /api/doctors/me
// @desc    Get current doctor profile
// @access  Private (Doctor only)
router.get('/me', restrictTo('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    res.json({
      status: 'success',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching doctor profile'
    });
  }
});

// @route   PUT /api/doctors/me
// @desc    Update current doctor profile
// @access  Private (Doctor only)
router.put('/me', restrictTo('doctor'), async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'qualifications', 'hospitalAffiliation', 'consultationFee', 'availability'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor profile not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating doctor profile'
    });
  }
});

module.exports = router;
