const express = require('express');
const router = express.Router();
const HealthMetric = require('../models/HealthMetric');
const Patient = require('../models/Patient');
const { protect, restrictTo } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/health-metrics
// @desc    Add new health metric
// @access  Private (Patient only)
router.post('/', restrictTo('patient'), async (req, res) => {
  try {
    const { type, value, unit, label, color, notes, recordedAt } = req.body;

    // Get patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    
    if (!patient) {
      return res.status(404).json({
        status: 'error',
        message: 'Patient profile not found'
      });
    }

    // Create health metric
    const healthMetric = await HealthMetric.create({
      patientId: patient._id,
      userId: req.user._id,
      type,
      value,
      unit: unit || '',
      label,
      color: color || '#4facfe',
      notes,
      recordedAt: recordedAt || new Date()
    });

    res.status(201).json({
      status: 'success',
      message: 'Health metric added successfully',
      data: healthMetric
    });
  } catch (error) {
    console.error('Error adding health metric:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding health metric'
    });
  }
});

// @route   GET /api/health-metrics
// @desc    Get all health metrics for current user
// @access  Private (Patient only)
router.get('/', restrictTo('patient'), async (req, res) => {
  try {
    const { type, limit = 100, startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    // Filter by type if provided
    if (type) {
      query.type = type;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.recordedAt = {};
      if (startDate) query.recordedAt.$gte = new Date(startDate);
      if (endDate) query.recordedAt.$lte = new Date(endDate);
    }

    const metrics = await HealthMetric.find(query)
      .sort('-recordedAt')
      .limit(parseInt(limit));

    res.json({
      status: 'success',
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching health metrics'
    });
  }
});

// @route   GET /api/health-metrics/latest
// @desc    Get latest reading for each metric type
// @access  Private (Patient only)
router.get('/latest', restrictTo('patient'), async (req, res) => {
  try {
    const metrics = await HealthMetric.aggregate([
      { $match: { userId: req.user._id } },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$type',
          latestMetric: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$latestMetric' } }
    ]);

    res.json({
      status: 'success',
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching latest metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching latest metrics'
    });
  }
});

// @route   GET /api/health-metrics/:id
// @desc    Get health metric by ID
// @access  Private (Patient only)
router.get('/:id', restrictTo('patient'), async (req, res) => {
  try {
    const metric = await HealthMetric.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!metric) {
      return res.status(404).json({
        status: 'error',
        message: 'Health metric not found'
      });
    }

    res.json({
      status: 'success',
      data: metric
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching health metric'
    });
  }
});

// @route   PUT /api/health-metrics/:id
// @desc    Update health metric
// @access  Private (Patient only)
router.put('/:id', restrictTo('patient'), async (req, res) => {
  try {
    const { value, notes, recordedAt } = req.body;
    
    const metric = await HealthMetric.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { value, notes, recordedAt },
      { new: true, runValidators: true }
    );

    if (!metric) {
      return res.status(404).json({
        status: 'error',
        message: 'Health metric not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Health metric updated successfully',
      data: metric
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating health metric'
    });
  }
});

// @route   DELETE /api/health-metrics/:id
// @desc    Delete health metric
// @access  Private (Patient only)
router.delete('/:id', restrictTo('patient'), async (req, res) => {
  try {
    const metric = await HealthMetric.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!metric) {
      return res.status(404).json({
        status: 'error',
        message: 'Health metric not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Health metric deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error deleting health metric'
    });
  }
});

// @route   GET /api/health-metrics/stats/summary
// @desc    Get health metrics summary/statistics
// @access  Private (Patient only)
router.get('/stats/summary', restrictTo('patient'), async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const query = {
      userId: req.user._id,
      recordedAt: { $gte: startDate }
    };
    
    if (type) {
      query.type = type;
    }

    const metrics = await HealthMetric.find(query).sort('recordedAt');

    // Calculate basic statistics
    const stats = {
      totalReadings: metrics.length,
      types: [...new Set(metrics.map(m => m.type))],
      dateRange: {
        start: startDate,
        end: new Date()
      }
    };

    res.json({
      status: 'success',
      data: stats,
      readings: metrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching health metrics summary'
    });
  }
});

module.exports = router;
