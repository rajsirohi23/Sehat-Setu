const express = require('express');
const router = express.Router();
const https = require('https');
const { protect } = require('../middleware/auth');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Detect what context to fetch based on user message
function needsDoctorContext(msg) {
  return /doctor|physician|specialist|consult|appointment|book|clinic|hospital|cardiolog|dermatolog|neurolog|pediatric|psychiatr|orthoped|surgeon|general/i.test(msg);
}
function needsPatientContext(msg) {
  return /my health|my record|my history|my condition|my allerg|my blood|my medication|my prescription|my appointment/i.test(msg);
}

function callGroq(apiKey, messages) {
  const payload = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.7,
    max_tokens: 600
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(parsed?.error?.message || `Groq error ${res.statusCode}`));
          } else {
            resolve(parsed.choices?.[0]?.message?.content || 'Sorry, no response generated.');
          }
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ status: 'error', message: 'Message is required' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.status(503).json({ status: 'error', message: 'AI service not configured. Add GROQ_API_KEY to .env' });
    }

    // --- Gather real-time context from DB ---
    let contextBlocks = [];

    // 1. Inject registered doctors from DB
    if (needsDoctorContext(message)) {
      const doctors = await Doctor.find({}).select('name specialty experience consultationFee clinicAddress hospitalAffiliation').limit(20);
      if (doctors.length > 0) {
        const doctorList = doctors.map(d =>
          `- Dr. ${d.name} | Specialty: ${d.specialty} | Experience: ${d.experience} yrs | Fee: ₹${d.consultationFee}${d.hospitalAffiliation?.name ? ' | Hospital: ' + d.hospitalAffiliation.name : ''}`
        ).join('\n');
        contextBlocks.push(`DOCTORS REGISTERED ON SEHAT SETU PLATFORM (real data from our database):\n${doctorList}`);
      }
    }

    // 2. Inject patient's own health data
    if (needsPatientContext(message)) {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) {
        const patientInfo = [
          `Name: ${patient.name}`,
          patient.bloodGroup ? `Blood Group: ${patient.bloodGroup}` : null,
          patient.gender ? `Gender: ${patient.gender}` : null,
          patient.allergies?.length ? `Allergies: ${patient.allergies.join(', ')}` : null,
          patient.medicalHistory?.length ? `Medical History: ${patient.medicalHistory.map(h => h.condition).join(', ')}` : null,
        ].filter(Boolean).join('\n');
        contextBlocks.push(`THIS PATIENT'S HEALTH PROFILE (real data):\n${patientInfo}`);
      }

      // Also inject their upcoming appointments
      const appts = await Appointment.find({ patientId: patient?._id, status: 'scheduled' })
        .populate('doctorId', 'name specialty').limit(5);
      if (appts.length > 0) {
        const apptList = appts.map(a =>
          `- ${new Date(a.appointmentDate).toLocaleDateString()} at ${a.appointmentTime} with Dr. ${a.doctorId?.name} (${a.doctorId?.specialty})`
        ).join('\n');
        contextBlocks.push(`PATIENT'S UPCOMING APPOINTMENTS:\n${apptList}`);
      }
    }

    // Build system prompt with injected context
    let systemContent = `You are an AI health assistant for Sehat Setu, a medical platform in India. Help patients with health questions, symptoms, and wellness guidance. Be empathetic, clear, and concise. Always recommend consulting a real doctor for diagnosis. Respond in the same language the user uses (Hindi or English).`;

    if (contextBlocks.length > 0) {
      systemContent += `\n\nREAL-TIME DATA FROM SEHAT SETU DATABASE (use this to answer accurately):\n\n${contextBlocks.join('\n\n')}`;
    }

    const messages = [{ role: 'system', content: systemContent }];

    (history || []).slice(-10).forEach(msg => {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
    });
    messages.push({ role: 'user', content: message });

    const reply = await callGroq(apiKey, messages);
    res.json({ status: 'success', reply });

  } catch (error) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ status: 'error', message: error.message || 'Error processing your request' });
  }
});

module.exports = router;
