const express = require('express');
const router = express.Router();
const LabCentre = require('../models/LabCentre');
const LabTest = require('../models/LabTest');
const LabBooking = require('../models/LabBooking');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const ReportGenerator = require('../services/ReportGenerator');
const AIService = require('../services/AIService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const jwt = require('jsonwebtoken');

// --- AI Analysis Route (Lab Assistant) ---
router.post('/analyze-report', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: "No report image uploaded" });

        // Delegate to AIService Orchestrator (Task: lab_analysis)
        const analysisResult = await AIService.routeRequest({
            task: 'lab_analysis',
            imageBuffer: file.buffer,
            mimeType: file.mimetype
        });

        res.json(analysisResult);

    } catch (err) {
        console.error("Lab Analysis Error:", err);
        res.status(500).json({ message: "Analysis Failed" });
    }
});

// --- Public Routes ---

const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Register New Lab
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, address, city, district, contactNumber, availableTestTypes } = req.body;

        // Check if exists
        let existingLab = await LabCentre.findOne({ email });
        if (existingLab) return res.status(400).json({ message: 'Lab already registered with this email' });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newLab = new LabCentre({
            name,
            email,
            password: hashedPassword,
            address,
            city,
            district,
            contactNumber,
            availableTestTypes,
            verificationStatus: 'pending' // Admin must approve
        });

        await newLab.save();

        // Real-Time Stats Emission
        const io = req.app.get('io');
        if (io) {
            const doctorCount = await Doctor.countDocuments({ verificationStatus: 'approved' });
            const specialtyCount = (await Doctor.distinct('specialization', { verificationStatus: 'approved' })).length;
            const patientCount = await Patient.countDocuments();
            const labCount = await LabCentre.countDocuments({ verificationStatus: 'approved' });

            io.emit('stats_update', {
                doctors: doctorCount,
                specialties: specialtyCount,
                patients: patientCount,
                labs: labCount
            });
        }

        res.status(201).json({ message: 'Registration Successful! Waiting for Admin Approval.' });

    } catch (err) {
        console.error("Lab Register Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Lab Login (Email & Password)
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // Changed from labId to email
    try {
        // Find by Email
        const lab = await LabCentre.findOne({ email });
        if (!lab) return res.status(400).json({ message: 'Lab Not Found' });

        // Verify Password
        const isMatch = await bcrypt.compare(password, lab.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        // Generate Token
        const token = jwt.sign(
            { id: lab._id, role: 'lab_assistant' },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token, lab: { id: lab._id, name: lab.name, email: lab.email } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 8. Get Lab Profile (Protected)
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const lab = await LabCentre.findById(req.user.id).select('-password');
        if (!lab) return res.status(404).json({ message: 'Lab not found' });
        res.json(lab);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 9. Update Lab Profile (Protected)
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, address, city, district, state, contactNumber, website, isHomeCollectionAvailable, availableTestTypes } = req.body;

        let lab = await LabCentre.findById(req.user.id);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        // Update Fields
        lab.name = name || lab.name;
        lab.address = address || lab.address;
        lab.city = city || lab.city;
        lab.district = district || lab.district;
        lab.state = state || lab.state;
        lab.contactNumber = contactNumber || lab.contactNumber;
        lab.website = website || lab.website;
        if (isHomeCollectionAvailable !== undefined) lab.isHomeCollectionAvailable = isHomeCollectionAvailable;
        if (availableTestTypes) lab.availableTestTypes = availableTestTypes;

        await lab.save();
        res.json(lab);

    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 1. Get All Tests (Catalog)
router.get('/tests', async (req, res) => {
    try {
        const tests = await LabTest.find();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 1.5 Get All States
router.get('/states', async (req, res) => {
    try {
        const states = await LabCentre.distinct('state');
        res.json(states.sort());
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 1.6 Get All Districts (Optional State Filter)
router.get('/districts', async (req, res) => {
    const { state } = req.query;
    try {
        let query = {};
        if (state) query.state = state;

        const districts = await LabCentre.distinct('district', query);
        res.json(districts.sort());
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 2. Search Labs by District
router.get('/centres', async (req, res) => {
    const { district } = req.query;
    try {
        if (!district) return res.status(400).json({ message: 'District is required' });

        // Case insensitive search
        const regex = new RegExp(district, 'i');
        const labs = await LabCentre.find({
            $or: [{ district: regex }, { city: regex }]
        });
        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// 2.5 Get Single Lab Public Profile
router.get('/public/:id', async (req, res) => {
    try {
        const lab = await LabCentre.findById(req.params.id)
            .select('-password -verificationStatus -__v');
        if (!lab) return res.status(404).json({ message: 'Lab not found' });
        res.json(lab);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 3. Book a Test
router.post('/book', verifyToken, async (req, res) => {
    const { labId, testIds, date, collectionType, address, totalAmount, paymentId, orderId } = req.body;

    try {
        // Validate Lab & Tests
        const lab = await LabCentre.findById(labId);
        if (!lab) return res.status(404).json({ message: 'Lab not found' });

        if (collectionType === 'home' && !lab.isHomeCollectionAvailable) {
            return res.status(400).json({ message: 'Home collection not available for this lab' });
        }

        const adminFee = Math.floor(totalAmount * 0.15);
        const providerAmount = totalAmount - adminFee;

        // Fix: Lookup Test Details from DB to ensure Price/Name accuracy & Schema compliance
        const tests = await LabTest.find({ _id: { $in: testIds } });
        if (tests.length !== testIds.length) {
            // Some tests might be missing or invalid IDs
            // We'll proceed with valid ones or error? Let's error to be safe.
            // return res.status(400).json({ message: 'Invalid Test IDs' });
        }

        const testDetails = tests.map(t => ({
            testName: t.name,
            price: t.standardPrice,
            // optional: store original ID if schema allows, but schema is strict on "testName, price"
            // We might want to add _id to schema later for linkage, but "code" or "name" is often enough.
        }));

        const newBooking = new LabBooking({
            patientId: req.user.id,
            labId,
            tests: testDetails, // Correctly mapped to Schema
            collectionType,
            address: collectionType === 'home' ? address : lab.address,
            scheduledDate: new Date(date),
            totalAmount,
            adminFee,
            providerAmount,
            paymentId,
            orderId,
            status: 'scheduled'
        });

        await newBooking.save();

        // Notification (Phase 13 Integration)
        const patientEmail = req.user.email;
        if (patientEmail) {
            const dateStr = new Date(date).toDateString();
            await notificationService.sendEmail(
                patientEmail,
                'Lab Test Booked',
                'Your test at ' + lab.name + ' is confirmed for ' + dateStr + '.'
            );
        }

        res.json({ message: 'Booking Successful', bookingId: newBooking._id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 4. Get My Bookings (Patient)
router.get('/my-bookings', verifyToken, async (req, res) => {
    try {
        const bookings = await LabBooking.find({ patientId: req.user.id })
            .populate('labId', 'name address contactNumber')
            .populate('tests', 'name code')
            .sort({ scheduledDate: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 4.5 Generate Lab Invoice PDF
router.get('/booking/:id/invoice', async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const booking = await LabBooking.findById(req.params.id)
            .populate('labId', 'name address contactNumber')
            .populate('patientId', 'name email');

        if (!booking) return res.status(404).send('Booking not found');

        const doc = new PDFDocument();

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=LabInvoice-${booking._id}.pdf`);

        doc.pipe(res);

        // --- PDF Content ---
        doc.fillColor('#0d9488').fontSize(24).text('DocOn Diagnostics', { align: 'center' });
        doc.fillColor('black').fontSize(10).text('Quality Care, Conveniently Delivered', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Lab Payment Receipt', { align: 'center', underline: true });
        doc.moveDown();

        // Transaction Info Box
        doc.rect(50, 150, 500, 110).stroke();
        doc.fontSize(10).text(`Invoice Number: LAB-${booking._id.toString().slice(-6).toUpperCase()}`, 60, 160);
        doc.text(`Date: ${new Date(booking.scheduledDate).toLocaleDateString()}`, 60, 180);
        doc.text(`Payment ID: ${booking.paymentId || 'N/A'}`, 60, 200);
        doc.text(`Order ID: ${booking.orderId || 'N/A'}`, 60, 220);
        doc.text(`Status: Paid`, 60, 240);

        // Provider Info
        doc.text('Diagnostic Centre:', 60, 280, { underline: true });
        doc.font('Helvetica-Bold').text(booking.labId.name, 60, 295);
        doc.font('Helvetica').text(booking.labId.address, 60, 310);

        // Patient Info
        doc.text('Billed To:', 300, 280, { underline: true });
        doc.font('Helvetica-Bold').text(booking.patientId.name, 300, 295);
        doc.font('Helvetica').text(`Patient ID: ${booking.patientId._id.toString().slice(-6)}`, 300, 310);

        doc.moveDown(5);

        // Line Items
        const startY = 360;
        doc.rect(50, startY, 500, 30).fill('#f3f4f6').stroke();
        doc.fillColor('black').font('Helvetica-Bold').text('Test Description', 60, startY + 10);
        doc.text('Price (INR)', 450, startY + 10);

        let currentY = startY + 40;
        booking.tests.forEach((test, index) => {
            doc.font('Helvetica').text(test.testName, 60, currentY);
            doc.text(`${test.price}.00`, 450, currentY);
            currentY += 20;
        });

        doc.rect(50, currentY + 10, 500, 0).stroke(); // Line

        doc.font('Helvetica-Bold').text('Total Paid', 350, currentY + 30);
        doc.fillColor('#0d9488').text(`INR ${booking.totalAmount}.00`, 450, currentY + 30);

        // Footer
        doc.fillColor('gray').fontSize(8).text('This is a computer-generated medical receipt.', 50, 700, { align: 'center' });

        doc.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating invoice');
    }
});

// -------------------------------------------------------------------------
// ADMIN ROUTES
// -------------------------------------------------------------------------

// 5. Get All Lab Bookings (Admin View)
router.get('/admin/bookings', verifyAdmin, async (req, res) => {
    try {
        const bookings = await LabBooking.find()
            .populate('patientId', 'name email phone') // Access to patient details
            .populate('labId', 'name')
            .populate('tests', 'name')
            .sort({ scheduledDate: -1 });
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 6. Get Lab Financials (Privacy Mode - No Medical Data)
router.get('/admin/financials', verifyAdmin, async (req, res) => {
    try {
        const bookings = await LabBooking.find({ status: { $ne: 'cancelled' } })
            .select('totalAmount scheduledDate labId status')
            .populate('labId', 'name district');

        const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        // Aggregate by Lab
        const labRevenue = {};
        bookings.forEach(b => {
            const name = b.labId?.name || 'Unknown';
            labRevenue[name] = (labRevenue[name] || 0) + b.totalAmount;
        });

        res.json({
            totalRevenue,
            totalBookings: bookings.length,
            labPerformance: labRevenue,
            transactions: bookings
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});


// -------------------------------------------------------------------------
// LAB ASSISTANT ROUTES (Protected)
// -------------------------------------------------------------------------

// 7. Get Assistant's Bookings (Privacy Enforced)
// CHANGED: Renamed to avoid collision with patient route
// 7. Get Assistant's Bookings (Privacy Enforced)
// CHANGED: Renamed to avoid collision with patient route
// 6.5 Cancel Booking (Patient)
router.delete('/booking/:id', verifyToken, async (req, res) => {
    try {
        const booking = await LabBooking.findOne({ _id: req.params.id, patientId: req.user.id });
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status !== 'scheduled') {
            return res.status(400).json({ message: 'Cannot cancel booking after processing has started' });
        }

        booking.status = 'cancelled';
        await booking.save();
        res.json({ message: 'Booking Cancelled' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 7. Get Assistant's Bookings (Privacy Enforced)
router.get('/assistant/bookings', verifyToken, async (req, res) => {
    try {
        // Temporary: trust labId passed in query until dedicated auth
        const { labId } = req.query;

        if (!labId) return res.status(400).json({ message: 'Lab ID Required' });

        const bookings = await LabBooking.find({ labId })
            .populate('patientId', 'name email phone')
            .populate('tests', 'name')
            .sort({ scheduledDate: 1 });

        // PRIVACY FILTER
        const safeBookings = bookings.map(b => {
            const isCompleted = b.status === 'report_generated' || b.status === 'completed';
            const p = b.patientId;
            return {
                _id: b._id,
                testIds: b.tests,
                totalAmount: b.totalAmount,
                status: b.status,
                scheduledDate: b.scheduledDate,
                collectionType: b.collectionType,
                // Redact if Completed
                patientName: p.name,
                patientPhone: isCompleted ? '***-***-****' : p.phone,
                address: isCompleted ? 'REDACTED' : b.address,
                // Report
                reportUrl: b.reportUrl
            };
        });

        res.json(safeBookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }

});

// 7.5 Update Booking Status (Lab Assistant)
router.put('/assistant/booking/:id/status', verifyToken, async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'sample_collected', 'processing'
        const booking = await LabBooking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking Not Found' });

        // Update Status
        booking.status = status;
        await booking.save();

        res.json({ message: 'Status Updated', status: booking.status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// 8. Submit Results & Generate/Save PDF Report
router.post('/results', verifyToken, async (req, res) => {
    const { bookingId, results, reportUrl } = req.body; // Accept reportUrl

    try {
        const booking = await LabBooking.findById(bookingId)
            .populate('patientId')
            .populate('labId');

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // --- SMART LAB AUTOMATION: Critical Value Check ---
        // Simple Rule Engine for Phase 3
        let isCritical = false;
        if (results && typeof results === 'object') {
            const rules = {
                'Hemoglobin': { min: 7, max: 20 },
                'Platelets': { min: 50000, max: 1000000 },
                'Glucose': { min: 0, max: 300 },
                'WBC': { min: 2000, max: 30000 }
            };

            for (const [test, value] of Object.entries(results)) {
                if (rules[test]) {
                    const val = parseFloat(value);
                    if (val < rules[test].min || val > rules[test].max) {
                        isCritical = true;
                        console.log(`[LAB-ALERT] Critical Value Detected for Booking ${bookingId}: ${test} = ${val}`);
                    }
                }
            }
        }
        booking.isCritical = isCritical;
        // --------------------------------------------------

        if (reportUrl) {
            // Case A: Manual PDF Upload
            booking.status = 'report_generated';
            booking.reportUrl = reportUrl;
        } else {
            // Case B: Auto-Generation (legacy fallback)
            const fileName = 'Report_' + booking._id + '.pdf';
            const uploadDir = path.join(__dirname, '../../uploads/reports');
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const filePath = path.join(uploadDir, fileName);
            await ReportGenerator.generate(booking, results, filePath);

            booking.status = 'report_generated';
            booking.reportUrl = '/uploads/reports/' + fileName;
        }

        await booking.save();

        // 3. Notify Patient
        if (booking.patientId && booking.patientId.email) {
            notificationService.sendEmail(
                booking.patientId.email,
                'Lab Report Ready',
                'Your Lab Report from ' + booking.labId.name + ' is ready. Log in to your dashboard to download.'
            );
        }

        res.json({ message: 'Report Saved Successfully', url: booking.reportUrl });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Report Processing Failed' });
    }
});

// EXPERIMENTAL: Admin Registry (added in Phase 21)
router.get('/admin/registry', async (req, res) => {
    try {
        const { district, type, search, page = 1, limit = 20 } = req.query;
        console.log('API REGISTRY REQUEST:', { district, type, search }); // DEBUG
        let query = {};
        if (district) {
            query.district = { $regex: new RegExp(district, 'i') };
        }
        if (type && type !== 'All') {
            const pathologyTests = [
                "Lipid Profile", "Troponin Test", "BNP", "Sugar Tests", "CBC (infection check)", "CRP", "Culture Sample",
                "Allergy Test (Blood)", "Hormone Tests", "Vitamin Tests", "Skin Biopsy", "Throat Swab", "Thyroid Profile (T3, T4, TSH)",
                "HbA1c", "Fasting Sugar", "Vitamin D & B12", "Liver Function Test (LFT)", "Stool Test", "Amylase / Lipase",
                "H. Pylori Blood Test", "Targeted Blood Sugar", "Urine Routine", "ESR", "Pregnancy Blood Test", "PCOS Profile",
                "Kidney Function Test (KFT)", "Electrolytes", "Microalbumin", "Vitamin B12 Check", "Tumor Markers",
                "General Eye Blood Tests", "Calcium Test", "Inflammatory Markers", "Pediatric CBC", "Pediatric Urine",
                "Metabolic Panel", "PSA"
            ];
            const radiologyTests = [
                "ECG / EKG", "Echocardiography", "Stress Test", "Holter Monitoring", "X-Ray (OPG)", "Dental Examination",
                "Audiometry", "Endoscopy", "Sinus CT Scan", "Colonoscopy", "Ultrasound", "General Ultrasound", "PAP Smear",
                "Internal Examination", "Dialysis", "Kidney Biopsy", "EEG", "MRI Brain", "Nerve Conduction Test", "PET Scan",
                "Bone Marrow", "Vision Testing", "OCT", "Retina Exam", "Bone Density Scan", "MRI Joint", "Sputum Test", "PFT",
                "Bronchoscopy", "Cystoscopy"
            ];

            if (type === 'Pathology') {
                query['availableTestTypes.testName'] = { $in: pathologyTests };
            } else if (type === 'Radiology') {
                query['availableTestTypes.testName'] = { $in: radiologyTests };
            } else {
                // Fallback for direct matches
                query['availableTestTypes.testName'] = type;
            }
        }
        if (search) {
            query.name = { $regex: new RegExp(search, 'i') };
        }

        const labs = await LabCentre.find(query)
            .select('name district city address contactNumber email availableTestTypes rating') // Strict Admin View - No Patient Data
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await LabCentre.countDocuments(query);

        res.json({
            labs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// 9. Get Patient's Own Bookings (History & Reports)
router.get('/patient/bookings', verifyToken, async (req, res) => {
    try {
        const bookings = await LabBooking.find({ patientId: req.user.id })
            .populate('labId', 'name address contactNumber email') // Show Lab Details
            .populate('tests', 'name code') // Show Test Names
            .sort({ scheduledDate: -1 });

        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Get Lab Financials (Private)
router.get('/financials', verifyToken, async (req, res) => {
    try {
        const { labId } = req.query;
        if (!labId) return res.status(400).json({ message: "Lab ID required" });

        const mongoose = require('mongoose');
        const lId = new mongoose.Types.ObjectId(labId);

        // Calculate Revenue (Completed bookings)
        // Note: LabBooking doesn't always have 'completed'. It has 'report_generated'. 
        // Let's assume 'report_generated' counts as revenue realized, or 'completed'.
        // Let's include both for safety: $in: ['report_generated', 'completed']
        const stats = await LabBooking.aggregate([
            {
                $match: {
                    labId: lId,
                    status: { $in: ['report_generated', 'completed'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: { $sum: { $ifNull: ["$providerAmount", { $multiply: ["$totalAmount", 0.85] }] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const history = await LabBooking.find({
            labId,
            status: { $in: ['report_generated', 'completed'] }
        })
            .populate('testIds', 'name') // Populate test names
            .sort({ scheduledDate: -1 })
            .limit(20);

        const sanitizedHistory = history.map(h => {
            const net = h.providerAmount !== undefined ? h.providerAmount : (h.totalAmount ? h.totalAmount * 0.85 : 0);
            return {
                _id: h._id,
                date: h.scheduledDate,
                patientName: h.patientName || "Walk-in", // Some labs might not have patient link if guest? Schema requires patientId.
                testNames: h.testIds.map(t => t.name).join(', '),
                amount: Math.floor(net),
                isNet: true
            };
        });

        res.json({
            earnings: Math.floor(stats[0]?.totalEarnings || 0),
            completedCount: stats[0]?.count || 0,
            history: sanitizedHistory
        });

    } catch (err) {
        console.error("Lab Financials Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Admin Lab Stats
router.get('/admin/stats/:labId', async (req, res) => {
    try {
        const { labId } = req.params;
        const bookings = await LabBooking.find({ labId })
            .populate('patientId', 'name email')
            .sort({ scheduledDate: -1 });

        const stats = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
            patientsServed: new Set(bookings.map(b => b.patientId?._id.toString())).size,
            modeStats: {
                home: bookings.filter(b => b.collectionType === 'home').length,
                walkIn: bookings.filter(b => b.collectionType === 'walk_in').length
            },
            topTests: {},
            // Detailed Patient History for Admin
            patientHistory: bookings.slice(0, 50).map(b => ({
                patientName: b.patientId?.name || "Unknown/Deleted",
                patientEmail: b.patientId?.email,
                testNames: b.tests.map(t => typeof t === 'string' ? t : t.testName).join(', '),
                date: b.scheduledDate,
                amount: b.totalAmount,
                status: b.status
            }))
        };

        // Calculate Top Tests
        bookings.forEach(b => {
            b.tests.forEach(t => {
                const name = typeof t === 'string' ? t : t.testName;
                if (name) {
                    stats.topTests[name] = (stats.topTests[name] || 0) + 1;
                }
            });
        });

        // Sort Top Tests
        stats.topTests = Object.entries(stats.topTests)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .reduce((obj, [key, val]) => { obj[key] = val; return obj; }, {});

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Stats Failed" });
    }
});

// --- Lab Assistant: Update Booking Status ---
router.put('/assistant/booking/:bookingId/status', verifyToken, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        const allowed = ['scheduled', 'sample_collected', 'processing', 'report_generated', 'completed'];
        if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const booking = await LabBooking.findByIdAndUpdate(
            bookingId,
            { status },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Status updated', booking });
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Lab Assistant: Upload PDF Report ---
const reportStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/reports';
        if (!require('fs').existsSync(dir)) require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`);
    }
});
const uploadReport = multer({ storage: reportStorage });

router.post('/assistant/upload-report', verifyToken, uploadReport.single('report'), async (req, res) => {
    try {
        const { bookingId } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const reportUrl = `/uploads/reports/${req.file.filename}`;
        const booking = await LabBooking.findByIdAndUpdate(
            bookingId,
            { reportUrl, status: 'report_generated' },
            { new: true }
        );
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json({ message: 'Report uploaded successfully', reportUrl });
    } catch (err) {
        console.error('Report upload error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
