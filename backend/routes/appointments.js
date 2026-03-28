const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect, restrictTo } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Patient only)
router.post('/', restrictTo('patient'), async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason, symptoms, type } = req.body;

    // Get patient ID from user
    const Patient = require('../models/Patient');
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        status: 'error',
        message: 'Doctor not found'
      });
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      symptoms,
      type: type || 'video'
    });

    res.status(201).json({
      status: 'success',
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error creating appointment'
    });
  }
});

// @route   GET /api/appointments
// @desc    Get appointments (filtered by user type)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.userType === 'patient') {
      const Patient = require('../models/Patient');
      const patient = await Patient.findOne({ userId: req.user._id });
      query.patientId = patient._id;
    } else if (req.user.userType === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      query.doctorId = doctor._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name phone bloodGroup')
      .populate('doctorId', 'name specialty consultationFee')
      .sort('-appointmentDate');

    res.json({
      status: 'success',
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching appointments'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    res.json({
      status: 'success',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching appointment'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    // Patients can update: appointmentDate, appointmentTime, reason, symptoms
    // Doctors can update: status, diagnosis, consultationNotes, prescription
    const allowedUpdates = req.user.userType === 'patient' 
      ? ['appointmentDate', 'appointmentTime', 'reason', 'symptoms']
      : ['status', 'diagnosis', 'consultationNotes', 'prescription'];

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        appointment[key] = req.body[key];
      }
    });

    await appointment.save();

    res.json({
      status: 'success',
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating appointment'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        status: 'error',
        message: 'Appointment not found'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      status: 'success',
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling appointment'
    });
  }
});

module.exports = router;
