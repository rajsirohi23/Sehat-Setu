const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType, name, phone, ...profileData } = req.body;

    // Validate required fields
    if (!email || !password || !userType || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email, password, userType, and name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      userType
    });

    // Create profile based on user type
    let profile;
    if (userType === 'patient') {
      profile = await Patient.create({
        userId: user._id,
        name,
        phone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        bloodGroup: profileData.bloodGroup
      });
    } else if (userType === 'doctor') {
      profile = await Doctor.create({
        userId: user._id,
        name,
        phone,
        licenseNumber: profileData.licenseNumber,
        specialty: profileData.specialty,
        experience: profileData.experience || 0
      });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: profile
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Get user profile
    let profile;
    if (user.userType === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    } else if (user.userType === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      status: 'success',
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: profile
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during login'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    let profile;
    if (req.user.userType === 'patient') {
      profile = await Patient.findOne({ userId: req.user._id });
    } else if (req.user.userType === 'doctor') {
      profile = await Doctor.findOne({ userId: req.user._id });
    }

    res.json({
      status: 'success',
      user: {
        id: req.user._id,
        email: req.user.email,
        userType: req.user.userType,
        profile: profile
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, licenseNumber, specialty, experience, clinicAddress, bio, dateOfBirth, gender, bloodGroup, address, emergencyContact } = req.body;

    let profile;
    if (req.user.userType === 'doctor') {
      profile = await Doctor.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { name, phone, licenseNumber, specialty, experience, clinicAddress, bio } },
        { new: true, runValidators: false }
      );
    } else if (req.user.userType === 'patient') {
      profile = await Patient.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { name, phone, dateOfBirth, gender, bloodGroup, address, emergencyContact } },
        { new: true, runValidators: false }
      );
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    const accessToken = generateToken(user._id);

    res.json({
      status: 'success',
      accessToken
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired refresh token'
    });
  }
});

module.exports = router;
