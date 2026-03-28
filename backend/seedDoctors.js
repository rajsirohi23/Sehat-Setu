/**
 * Seed Script - Creates sample doctors across Indian cities
 * Run with: node seedDoctors.js
 * Run from backend/ folder
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

const doctors = [
  // Mathura
  { name: 'Dr. Priya Sharma', email: 'priya.sharma@sehat.com', specialty: 'dermatology', experience: 8, city: 'Mathura', hospital: 'Mathura Skin & Care Clinic', address: 'Dampier Nagar, Mathura, UP', fee: 500, license: 'UP-DERM-001' },
  { name: 'Dr. Rajesh Gupta', email: 'rajesh.gupta@sehat.com', specialty: 'general', experience: 12, city: 'Mathura', hospital: 'Gupta Medical Centre', address: 'Krishna Nagar, Mathura, UP', fee: 300, license: 'UP-GEN-002' },
  { name: 'Dr. Sunita Agarwal', email: 'sunita.agarwal@sehat.com', specialty: 'pediatrics', experience: 10, city: 'Mathura', hospital: 'Bal Seva Hospital', address: 'Vrindavan Road, Mathura, UP', fee: 400, license: 'UP-PED-003' },

  // Delhi
  { name: 'Dr. Amit Verma', email: 'amit.verma@sehat.com', specialty: 'cardiology', experience: 15, city: 'Delhi', hospital: 'Apollo Spectra Delhi', address: 'Karol Bagh, New Delhi', fee: 1200, license: 'DL-CARD-004' },
  { name: 'Dr. Neha Singh', email: 'neha.singh@sehat.com', specialty: 'dermatology', experience: 7, city: 'Delhi', hospital: 'Skin Solutions Delhi', address: 'Lajpat Nagar, New Delhi', fee: 800, license: 'DL-DERM-005' },
  { name: 'Dr. Vikram Malhotra', email: 'vikram.malhotra@sehat.com', specialty: 'orthopedics', experience: 18, city: 'Delhi', hospital: 'Fortis Bone & Joint', address: 'Vasant Kunj, New Delhi', fee: 1500, license: 'DL-ORTH-006' },
  { name: 'Dr. Kavita Joshi', email: 'kavita.joshi@sehat.com', specialty: 'neurology', experience: 11, city: 'Delhi', hospital: 'Max Neuro Centre', address: 'Saket, New Delhi', fee: 1000, license: 'DL-NEUR-007' },

  // Agra
  { name: 'Dr. Suresh Yadav', email: 'suresh.yadav@sehat.com', specialty: 'general', experience: 9, city: 'Agra', hospital: 'Yadav Clinic', address: 'Sanjay Place, Agra, UP', fee: 250, license: 'UP-GEN-008' },
  { name: 'Dr. Meena Rastogi', email: 'meena.rastogi@sehat.com', specialty: 'psychiatry', experience: 6, city: 'Agra', hospital: 'Mind Wellness Agra', address: 'Civil Lines, Agra, UP', fee: 600, license: 'UP-PSY-009' },

  // Mumbai
  { name: 'Dr. Rahul Mehta', email: 'rahul.mehta@sehat.com', specialty: 'cardiology', experience: 20, city: 'Mumbai', hospital: 'Lilavati Hospital', address: 'Bandra West, Mumbai', fee: 2000, license: 'MH-CARD-010' },
  { name: 'Dr. Pooja Desai', email: 'pooja.desai@sehat.com', specialty: 'dermatology', experience: 9, city: 'Mumbai', hospital: 'Skin & You Clinic', address: 'Andheri West, Mumbai', fee: 900, license: 'MH-DERM-011' },
  { name: 'Dr. Arjun Nair', email: 'arjun.nair@sehat.com', specialty: 'surgery', experience: 14, city: 'Mumbai', hospital: 'Kokilaben Hospital', address: 'Andheri West, Mumbai', fee: 1800, license: 'MH-SURG-012' },

  // Bangalore
  { name: 'Dr. Deepa Krishnan', email: 'deepa.krishnan@sehat.com', specialty: 'neurology', experience: 13, city: 'Bangalore', hospital: 'Manipal Hospital', address: 'Old Airport Road, Bangalore', fee: 1100, license: 'KA-NEUR-013' },
  { name: 'Dr. Sanjay Reddy', email: 'sanjay.reddy@sehat.com', specialty: 'orthopedics', experience: 16, city: 'Bangalore', hospital: 'Sakra World Hospital', address: 'Marathahalli, Bangalore', fee: 1400, license: 'KA-ORTH-014' },

  // Lucknow
  { name: 'Dr. Alok Srivastava', email: 'alok.srivastava@sehat.com', specialty: 'general', experience: 11, city: 'Lucknow', hospital: 'Srivastava Medical Centre', address: 'Hazratganj, Lucknow, UP', fee: 350, license: 'UP-GEN-015' },
  { name: 'Dr. Ritu Pandey', email: 'ritu.pandey@sehat.com', specialty: 'pediatrics', experience: 8, city: 'Lucknow', hospital: 'Child Care Hospital', address: 'Gomti Nagar, Lucknow, UP', fee: 450, license: 'UP-PED-016' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    let created = 0, skipped = 0;

    for (const d of doctors) {
      // Skip if email already exists
      const exists = await User.findOne({ email: d.email });
      if (exists) { skipped++; continue; }

      // Create user account
      const user = await User.create({
        email: d.email,
        password: 'Doctor@123',
        userType: 'doctor'
      });

      // Create doctor profile
      await Doctor.create({
        userId: user._id,
        name: d.name,
        phone: `+91-${Math.floor(7000000000 + Math.random() * 2999999999)}`,
        licenseNumber: d.license,
        specialty: d.specialty,
        experience: d.experience,
        consultationFee: d.fee,
        clinicAddress: d.address,
        hospitalAffiliation: { name: d.hospital, address: d.address },
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        totalConsultations: Math.floor(50 + Math.random() * 500)
      });

      console.log(`  ✓ Created: ${d.name} (${d.specialty}) - ${d.city}`);
      created++;
    }

    console.log(`\n✅ Done! Created: ${created}, Skipped (already exist): ${skipped}`);
    console.log(`\nAll doctor accounts use password: Doctor@123`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
