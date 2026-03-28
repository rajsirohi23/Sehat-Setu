const express = require('express');
const router = express.Router();

// @route   POST /api/contact
// @desc    Handle contact form submission
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields'
      });
    }

    // In production, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Integrate with support ticket system

    console.log('Contact form submission:', { name, email, subject, message });

    res.json({
      status: 'success',
      message: 'Thank you for contacting us. We will get back to you soon.'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error processing contact form'
    });
  }
});

module.exports = router;
