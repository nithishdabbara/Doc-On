const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Added for JWT token generation
const { sendOTP, sendVerificationEmail } = require('../utils/emailService'); // Updated Import
const notificationService = require('../services/notificationService'); // Phase 13 Import
const crypto = require('crypto'); // Built-in for tokens
const { verifyToken } = require('../middleware/auth');

// Fetch Historical Vitals (Smart Extraction from Notes)
router.get('/vitals-history/:patientId', verifyToken, async (req, res) => {
    try {
        const { patientId } = req.params;

        // Fetch completed appointments with notes
        const history = await Appointment.find({
            patientId,
            status: 'completed',
            treatmentNotes: { $exists: true, $ne: '' }
        }).sort({ date: 1 });

        const data = history.map(apt => {
            const notes = apt.treatmentNotes || '';

            // Regex Extraction
            const bpMatch = notes.match(/(\d{2,3})\/(\d{2,3})/); // 120/80
            const sugarMatch = notes.match(/(?:sugar|glucose|lbs|weight).*?(\d{2,3})/i); // "Sugar 140" or "Weight 180"

            if (bpMatch || sugarMatch) {
                return {
                    date: new Date(apt.date).toLocaleDateString(),
                    bpSystolic: bpMatch ? parseInt(bpMatch[1]) : null,
                    bpDiastolic: bpMatch ? parseInt(bpMatch[2]) : null,
                    glucose: sugarMatch ? parseInt(sugarMatch[1]) : null
                };
            }
            return null;
        }).filter(item => item !== null);

        res.json(data);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch vitals history" });
    }
});

// Register Patient (Step 1: Send Verification Link)
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await Patient.findOne({ email });
        if (user && user.isEmailVerified) return res.status(400).json({ message: 'User already exists' });

        // Generate Verification Token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        if (!user) {
            // New User
            const hashedPassword = await bcrypt.hash(password, 10);
            user = new Patient({
                name,
                email,
                password: hashedPassword,
                verificationToken,
                tokenExpires,
                isEmailVerified: false
            });
        } else {
            // Existing unverified user (Resend Link)
            user.verificationToken = verificationToken;
            user.tokenExpires = tokenExpires;
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        await sendVerificationEmail(email, verificationToken);

        res.json({ message: 'Verification Link Sent to Email' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Verify Email Token (Step 2: Confirm Account)
router.post('/verify-email-token', async (req, res) => {
    const { token } = req.body;
    try {
        const user = await Patient.findOne({
            verificationToken: token,
            tokenExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or Expired Token' });

        user.isEmailVerified = true;
        user.verificationToken = undefined;
        user.tokenExpires = undefined;
        await user.save();

        // No login token here, just success. Redirection happens on frontend.
        res.json({ message: 'Email Verified Successfully' });

    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Book Appointment (with Time Slot Validation & Advanced Features)
router.post('/book', async (req, res) => {
    const { doctorId, patientId, date, patientName, reason, attachments } = req.body;

    try {
        const appointmentDate = new Date(date);

        // 1. Calculate Slot Range (Strict 1 Hour Slots)
        const slotStart = new Date(appointmentDate);
        slotStart.setMinutes(0, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setHours(slotStart.getHours() + 1);

        // 2a. Doctor Availability Check
        const doctorConflict = await Appointment.findOne({
            doctorId,
            date: { $gte: slotStart, $lt: slotEnd },
            status: { $ne: 'cancelled' }
        });

        if (doctorConflict) {
            return res.status(400).json({ message: 'Doctor is already booked at this time. Please choose another slot.' });
        }

        // 2b. Patient Double-Booking Check (PREVENT OVERLAP)
        // STRICT: Patient ID is now required to prevent loopholes
        if (!patientId) {
            return res.status(400).json({ message: 'Patient identification missing. Please re-login.' });
        }

        // Ensure we are comparing ObjectIds correctly
        const mongoose = require('mongoose');
        const pId = new mongoose.Types.ObjectId(patientId);

        const patientConflict = await Appointment.findOne({
            patientId: pId,
            date: { $gte: slotStart, $lt: slotEnd },
            status: { $ne: 'cancelled' }
        });

        if (patientConflict) {
            // Check if it's the same doctor or different
            if (patientConflict.doctorId.toString() === doctorId) {
                return res.status(400).json({ message: 'You already have an appointment with this doctor at this time.' });
            } else {
                return res.status(400).json({ message: 'You already have an appointment with another doctor at this time. Please choose a different slot.' });
            }
        }

        // 3. Fetch Doctor Fee & Calculate Discount
        const Doctor = require('../models/Doctor');
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        // Calculate Fee based on Subscription
        const subscriptionPatient = await Patient.findById(patientId);
        let finalAmount = doctor.consultationFee;

        if (subscriptionPatient && subscriptionPatient.subscription && subscriptionPatient.subscription.expiresAt > new Date()) {
            if (subscriptionPatient.subscription.tier === 'gold') finalAmount = Math.ceil(doctor.consultationFee * 0.80); // 20% Off
            if (subscriptionPatient.subscription.tier === 'silver') finalAmount = Math.ceil(doctor.consultationFee * 0.95); // 5% Off
        }

        // 4. Handle Video Link Generation
        const appointmentType = req.body.type || 'in-person';
        let meetingLink = '';
        if (appointmentType === 'video') {
            // Generate a simple unique room name
            const uniqueSuffix = Date.now() + Math.random().toString(36).substring(7);
            meetingLink = `https://meet.jit.si/docon-${uniqueSuffix}`;
        }

        // 5. Create Appointment
        const adminFee = Math.floor(finalAmount * 0.15);
        const providerAmount = finalAmount - adminFee;

        const newAppointment = new Appointment({
            doctorId,
            patientId,
            patientName,
            date: slotStart,
            amount: finalAmount,
            adminFee,
            providerAmount,
            status: 'scheduled',
            paymentStatus: req.body.paymentStatus || 'pending', // Accept payment status from frontend
            paymentId: req.body.paymentId, // Save Razorpay Payment ID
            orderId: req.body.orderId, // Save Razorpay Order ID
            type: appointmentType,
            meetingLink: meetingLink,
            reasonForVisit: reason || '',
            patientAttachments: attachments || [] // Array of private file URLs
        });

        await newAppointment.save();

        // Phase 13: Send Confirmation Email
        const emailSubject = `Appointment Confirmed with ${doctor.name}`;
        const emailBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #047857;">Appointment Confirmed! ✅</h2>
                <p>Dear <strong>${patientName}</strong>,</p>
                <p>Your appointment has been successfully scheduled.</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <p><strong>Doctor:</strong> ${doctor.name}</p>
                    <p><strong>Specialization:</strong> ${doctor.specialization}</p>
                    <p><strong>Date & Time:</strong> ${slotStart.toLocaleString()}</p>
                    <p><strong>Type:</strong> ${appointmentType === 'video' ? 'Video Consultation 📹' : 'In-Person Visit 🏥'}</p>
                    ${appointmentType === 'video' ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : `<p><strong>Clinic Address:</strong> ${doctor.address}</p>`}
                </div>

                <p>Please arrive 10 minutes early or join the call on time.</p>
                <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Ref ID: ${newAppointment._id}</p>
            </div>
        `;

        // Find patient email to send to
        const patient = await Patient.findById(patientId);
        if (patient && patient.email) {
            await notificationService.sendEmail(patient.email, emailSubject, emailBody);
        }

        res.json({ message: 'Appointment Booked Successfully!', appointmentId: newAppointment._id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error booking appointment' });
    }
});

// Generate Invoice PDF
router.get('/appointments/:id/invoice', async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctorId', 'name specialization address phone')
            .populate('patientId', 'name email');

        if (!appointment) return res.status(404).send('Appointment not found');

        const doc = new PDFDocument();

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${appointment._id}.pdf`);

        doc.pipe(res);

        // --- PDF Content ---

        // Logo / Title
        doc.fillColor('#2563eb').fontSize(24).text('DocOn', { align: 'center' });
        doc.fillColor('black').fontSize(10).text('Healthcare Simplified', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Payment Receipt', { align: 'center', underline: true });
        doc.moveDown();

        // Transaction Info Box
        doc.rect(50, 150, 500, 110).stroke();
        doc.fontSize(10).text(`Invoice Number: INV-${appointment._id.toString().slice(-6).toUpperCase()}`, 60, 160);
        doc.text(`Date: ${new Date(appointment.date).toLocaleDateString()}`, 60, 180);
        doc.text(`Payment ID: ${appointment.paymentId || 'N/A'}`, 60, 200);
        doc.text(`Order ID: ${appointment.orderId || 'N/A'}`, 60, 220);
        doc.text(`Status: Paid`, 60, 240);

        // Bill To / From
        doc.text('Provider:', 60, 280, { underline: true });
        doc.font('Helvetica-Bold').text(`Dr. ${appointment.doctorId.name}`, 60, 295);
        doc.font('Helvetica').text(appointment.doctorId.specialization, 60, 310);

        doc.text('Billed To:', 300, 280, { underline: true });
        doc.font('Helvetica-Bold').text(appointment.patientId.name, 300, 295);
        doc.font('Helvetica').text(`Patient ID: ${appointment.patientId._id.toString().slice(-6)}`, 300, 310);

        doc.moveDown(5);

        // Line Items
        const startY = 360;
        doc.rect(50, startY, 500, 30).fill('#f3f4f6').stroke();
        doc.fillColor('black').font('Helvetica-Bold').text('Description', 60, startY + 10);
        doc.text('Amount (INR)', 450, startY + 10);

        doc.font('Helvetica').text('Consultation Fee', 60, startY + 40);
        doc.text(`${appointment.amount}.00`, 450, startY + 40);

        doc.rect(50, startY + 60, 500, 0).stroke(); // Line

        doc.font('Helvetica-Bold').text('Total', 350, startY + 80);
        doc.fillColor('#047857').text(`INR ${appointment.amount}.00`, 450, startY + 80);

        // Footer
        doc.fillColor('gray').fontSize(8).text('This is a computer-generated receipt.', 50, 700, { align: 'center' });

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating invoice');
    }
});

// Cancel Appointment (Patient Side)
router.put('/appointments/:id/cancel', async (req, res) => {
    try {
        const { reason } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Basic check: In a real app, verify req.user.id owns this appointment
        // if (appointment.patientId.toString() !== req.user.id) ... 

        appointment.status = 'cancelled';
        appointment.cancellationReason = reason;
        appointment.cancelledBy = 'patient';

        await appointment.save();
        res.json({ message: 'Appointment Cancelled', appointment });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get My Appointments/Records
// Ideally this should filter by Patient ID. 
// For this demo, let's just pass patientName as a filter or assume we fetch all and filter client side (not secure but simple)
// Better: Add patientId to Appointment model.
router.get('/appointments/:patientName', async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientName: req.params.patientName }).populate('doctorId', 'name specialization address phone email consultationFee');
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// -------------------------------------------------------------------------
// SPECIFIC ROUTES (Must come BEFORE /:id wildcards)
// -------------------------------------------------------------------------

// Get Current Patient (Self)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.id).select('-password -otp -otpExpires');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Profile
router.put('/me', verifyToken, async (req, res) => {
    try {
        const updates = req.body;

        // Handle Password Update explicitly
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        } else {
            delete updates.password; // Don't wipe it with undefined/null
        }

        // Prevent updating sensitive fields
        delete updates.email;
        delete updates.isEmailVerified;
        delete updates.otp;
        delete updates.isGoogleAuth; // Can't change auth type manually

        const patient = await Patient.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
        res.json(patient);
    } catch (err) {
        console.error("Profile Update Error", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete Account
router.delete('/me', verifyToken, async (req, res) => {
    try {
        await Patient.findByIdAndDelete(req.user.id);
        res.json({ message: 'Account Deleted Successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});



// Subscribe to Plan
router.post('/subscribe', verifyToken, async (req, res) => {
    const { tier } = req.body; // 'silver' or 'gold'
    if (!['silver', 'gold'].includes(tier)) return res.status(400).json({ message: 'Invalid Tier' });

    try {
        const patient = await Patient.findById(req.user.id);

        // Expiry = 1 Year from now
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        patient.subscription = { tier, expiresAt };
        await patient.save();

        res.json({ message: `Upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan!`, subscription: patient.subscription });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

const { checkDoctorAccess } = require('../middleware/accessMiddleware');

// Get Patient Details (Strict Access - Wildcard /:id must be LAST)
router.get('/:id', verifyToken, checkDoctorAccess, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).select('-password -otp -otpExpires -verificationToken');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Join Appointment (Mark as Arrived)
router.put('/appointments/:id/join', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const appointment = await Appointment.findById(id);

        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        // Verify ownership
        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Only update if scheduled or already arrived (idempotent)
        if (['scheduled', 'arrived'].includes(appointment.status)) {
            appointment.status = 'arrived';
            await appointment.save();
        }

        res.json({ message: "Joined successfully", status: appointment.status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Reschedule Appointment
router.put('/appointments/:id/reschedule', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.body;

        if (!date) return res.status(400).json({ message: "New date is required" });

        const appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ message: "Appointment not found" });

        // Verify it belongs to user
        if (appointment.patientId.toString() !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check availability
        const doctorId = appointment.doctorId;
        const newDate = new Date(date);

        // Check if slot is taken
        const existing = await Appointment.findOne({
            doctorId,
            date: newDate,
            status: { $nin: ['cancelled', 'no_show'] },
            _id: { $ne: id } // Exclude self
        });

        if (existing) {
            return res.status(400).json({ message: "Slot is already booked. Please choose another time." });
        }

        appointment.date = newDate;
        appointment.status = 'scheduled'; // Reset status to scheduled
        await appointment.save();

        res.json({ message: "Appointment rescheduled successfully", appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
