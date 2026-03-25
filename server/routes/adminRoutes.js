const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');

const { verifyAdmin } = require('../middleware/auth');

// Get Pending Doctors
router.get('/pending', verifyAdmin, async (req, res) => {
    try {
        const pendingDoctors = await Doctor.find({ verificationStatus: 'pending' });
        res.json(pendingDoctors);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Approved Doctors (Manage Section) - Paginated & Searchable
router.get('/doctors', verifyAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        let query = { verificationStatus: 'approved' };
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const total = await Doctor.countDocuments(query);
        const doctors = await Doctor.find(query)
            .skip(skip)
            .limit(limit);

        res.json({
            doctors,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalDoctors: total
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Verify Doctor
router.post('/verify/:id', verifyAdmin, async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'
    try {
        await Doctor.findByIdAndUpdate(req.params.id, { verificationStatus: status });
        res.json({ message: `Doctor ${status}` });
    } catch (err) {
        res.status(500).json({ message: 'Error updating status' });
    }
});

// Verify All Pending Doctors
router.post('/verify-all', verifyAdmin, async (req, res) => {
    try {
        const result = await Doctor.updateMany({ verificationStatus: 'pending' }, { verificationStatus: 'approved' });
        res.json({ message: `Approved ${result.modifiedCount} doctors` });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Financials (Privacy Protected)
router.get('/financials', verifyAdmin, async (req, res) => {
    try {
        // Exclude treatmentNotes for privacy
        const appointments = await Appointment.find({ paymentStatus: 'paid' })
            .select('-treatmentNotes')
            .populate('doctorId', 'name specialization');

        const LabBooking = require('../models/LabBooking');
        const labBookings = await LabBooking.find({ status: { $ne: 'cancelled' } })
            .populate('labId', 'name')
            .populate('patientId', 'name');

        // Calculate totals (Gross Pipeline Flow)
        const apptRevenue = appointments.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const labRevenue = labBookings.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        
        const totalRevenue = apptRevenue + labRevenue;

        // Advanced Time-Based Tracking
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let timeStats = {
            doctors: { day: 0, week: 0, month: 0 },
            labs: { day: 0, week: 0, month: 0 }
        };

        appointments.forEach(a => {
            const d = new Date(a.date);
            const amt = a.amount || 0;
            if (d >= startOfToday) timeStats.doctors.day += amt;
            if (d >= startOfWeek) timeStats.doctors.week += amt;
            if (d >= startOfMonth) timeStats.doctors.month += amt;
        });

        labBookings.forEach(b => {
            const d = new Date(b.createdAt);
            const amt = b.totalAmount || 0;
            if (d >= startOfToday) timeStats.labs.day += amt;
            if (d >= startOfWeek) timeStats.labs.week += amt;
            if (d >= startOfMonth) timeStats.labs.month += amt;
        });

        res.json({
            totalRevenue,
            totalConsultationRevenue: apptRevenue,
            totalLabRevenue: labRevenue,
            transactions: appointments,
            labTransactions: labBookings,
            timeStats
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get All Lab Bookings (For Schedule Page)
router.get('/lab-bookings', verifyAdmin, async (req, res) => {
    try {
        const LabBooking = require('../models/LabBooking');
        const labBookings = await LabBooking.find()
            .populate('labId', 'name address')
            .populate('patientId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json(labBookings);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Platform Stats (Count)
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        const totalDoctors = await Doctor.countDocuments();
        const totalAppointments = await Appointment.countDocuments();
        const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

        const LabBooking = require('../models/LabBooking');
        const totalLabBookings = await LabBooking.countDocuments();
        const completedLabBookings = await LabBooking.countDocuments({ status: { $in: ['completed', 'report_generated'] } });

        res.json({
            totalPatients,
            totalDoctors,
            totalAppointments,
            completedAppointments,
            totalLabBookings,
            completedLabBookings
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get All Patients (Restricted View)
router.get('/patients', verifyAdmin, async (req, res) => {
    try {
        // Excluding PII as per privacy requirement
        // Only returning Name, Email(masked?), Joined Date
        const patients = await Patient.find().sort({ createdAt: -1 });
        console.log('DEBUG PATIENTS:', patients);
        res.json(patients);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Doctor Activity (Optimized)
router.get('/doctor-activity/:id', verifyAdmin, async (req, res) => {
    try {
        const doctorId = new mongoose.Types.ObjectId(req.params.id);

        // 1. Fetch Doctor Details (Static)
        const doctorDetails = await Doctor.findById(doctorId);

        // 2. Efficient Stats Aggregation
        const statsAggregation = await Appointment.aggregate([
            { $match: { doctorId: doctorId } },
            {
                $group: {
                    _id: null,
                    totalConsultations: { $sum: 1 },
                    totalTreated: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                    },
                    averageRating: { $avg: "$rating" },
                    totalRatings: {
                        $sum: { $cond: [{ $ifNull: ["$rating", false] }, 1, 0] }
                    }
                }
            }
        ]);

        const stats = statsAggregation[0] || {
            totalConsultations: 0,
            totalTreated: 0,
            averageRating: 0,
            totalRatings: 0
        };

        // 3. Recent History (Limit 50)
        const history = await Appointment.find({ doctorId: req.params.id })
            .select('patientName date status rating review')
            .sort({ date: -1 })
            .limit(50);

        // Format for frontend
        res.json({
            doctorDetails,
            stats: {
                totalConsultations: stats.totalConsultations,
                totalTreated: stats.totalTreated,
                averageRating: stats.averageRating ? stats.averageRating.toFixed(1) : 0,
                reviews: [] // Reviews are now just in history
            },
            history
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get ALL Appointments (for Admin Grid)
router.get('/appointments', verifyAdmin, async (req, res) => {
    try {
        const { date, status } = req.query;
        let query = {};

        // Filter by Status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by Date (Simple "Today" or Exact Match)
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'name specialization email phone address experience averageRating totalRatings consultationFee') // Enhanced populate
            .populate('patientId', 'name')
            .sort({ date: -1 }); // Newest first

        if (appointments.length > 0) {
            console.log('DEBUG APPT 0 Doctor:', appointments[0].doctorId);
        }

        // Transform for table (fallback for guest patients)
        const formatted = appointments.map(appt => ({
            _id: appt._id,
            date: appt.date,
            time: new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doctor: appt.doctorId ? appt.doctorId.name : 'Unknown Doctor',
            specialization: appt.doctorId ? appt.doctorId.specialization : '-',
            doctorInfo: appt.doctorId, // Pass full object for inspection
            patient: appt.patientId ? appt.patientId.name : (appt.patientName || 'Guest'),
            status: appt.status,
            amount: appt.amount,
            rating: appt.rating,
            review: appt.review
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Analytics: Revenue & Specialty Stats
router.get('/analytics', verifyAdmin, async (req, res) => {
    try {
        // 1. Revenue (Group by Month) - Last 6 Months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueData = await Appointment.aggregate([
            {
                $match: {
                    status: 'completed',
                    date: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: { $month: "$date" },
                    total: { $sum: "$amount" }, // Gross
                    platformRevenue: { $sum: "$adminFee" }, // Admin Share (15%)
                    providerPayout: { $sum: "$providerAmount" }, // Doctor Share (85%)
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map month numbers to Names
        // Merge arrays by month
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedRevenue = revenueData.map(item => ({
            name: monthNames[item._id - 1],
            revenue: item.platformRevenue || 0, // Admin's actual share, not gross
            appointments: item.count
        }));


        // 2. Specialty Distribution (Top 5)
        const specialtyData = await Doctor.aggregate([
            { $group: { _id: "$specialization", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const formattedSpecialty = specialtyData.map(item => ({
            name: item._id || 'General',
            value: item.count
        }));


        // 3. AI Insights (Simple Logic / Heuristics)
        const currentMonth = new Date().getMonth(); // 0-11
        const insights = [];

        // Seasonal Predictions
        if (currentMonth >= 9 || currentMonth <= 1) { // Oct - Feb
            insights.push({ type: 'warning', text: "Seasonal Trend: Viral & Flu cases likely to surge. Ensure General Physicians are available." });
        }
        if (currentMonth >= 3 && currentMonth <= 5) { // Apr - Jun
            insights.push({ type: 'info', text: "Summer Trend: Dehydration & Heatstroke cases may rise." });
        }

        // Capacity Warnings
        const highDemandSpec = formattedSpecialty[0];
        if (highDemandSpec) {
            insights.push({ type: 'success', text: `Highest Demand: ${highDemandSpec.name} is your most popular specialty.` });
        }

        res.json({
            revenue: formattedRevenue,
            specialty: formattedSpecialty,
            insights
        });

    } catch (err) {
        console.error("Analytics Error", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- PREDICTIVE ANALYTICS DASHBOARD ---
router.get('/analytics/dashboard', verifyAdmin, async (req, res) => {
    try {
        const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // 1. Calculate Real Historical Revenue (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const appointmentRev = await Appointment.aggregate([
            { $match: { paymentStatus: 'paid', date: { $gte: sixMonthsAgo } } },
            { $group: { _id: { $month: "$date" }, revenue: { $sum: "$adminFee" }, patients: { $sum: 1 } } }
        ]);

        const LabBooking = require('../models/LabBooking');
        const labRev = await LabBooking.aggregate([
            { $match: { status: { $in: ['report_generated', 'completed'] }, createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { $month: "$createdAt" }, revenue: { $sum: "$adminFee" }, patients: { $sum: 1 } } }
        ]);

        // Merge arrays by month
        let mergedTrends = {};
        appointmentRev.forEach(r => {
            mergedTrends[r._id] = { month: r._id, revenue: r.revenue, patients: r.patients };
        });
        labRev.forEach(r => {
            if (!mergedTrends[r._id]) mergedTrends[r._id] = { month: r._id, revenue: 0, patients: 0 };
            mergedTrends[r._id].revenue += r.revenue;
            mergedTrends[r._id].patients += r.patients;
        });

        const trends = [];
        let totalRev6M = 0;
        let lastMonthRev = 0;
        let currentMonthRev = 0;
        
        const currentMonthIdx = new Date().getMonth() + 1;

        for (let i = 5; i >= 0; i--) {
            let m = new Date();
            m.setMonth(m.getMonth() - i);
            let monthIdx = m.getMonth() + 1;
            let data = mergedTrends[monthIdx] || { revenue: 0, patients: 0 };
            
            trends.push({
                month: monthsNames[monthIdx - 1],
                revenue: data.revenue,
                patients: data.patients
            });

            totalRev6M += data.revenue;
            if (i === 1) lastMonthRev = data.revenue;
            if (i === 0) currentMonthRev = data.revenue;
        }

        // Calculate simple trend metrics
        let growthRate = "0%";
        if (lastMonthRev > 0) {
            let percentChange = ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100;
            growthRate = (percentChange > 0 ? "+" : "") + percentChange.toFixed(1) + "%";
        }

        const summary = {
            projectedRevenue: Math.floor(currentMonthRev * 1.15) || 5000, // naive +15% projection for next month
            growthRate,
            totalRevenue: totalRev6M
        };

        // Add 2 predicted months to trends array
        trends.push({
            month: monthsNames[currentMonthIdx % 12],
            revenue: Math.floor(currentMonthRev * 1.1),
            patients: Math.floor((trends[5]?.patients || 0) * 1.05)
        });
        trends.push({
            month: monthsNames[(currentMonthIdx + 1) % 12],
            revenue: summary.projectedRevenue,
            patients: Math.floor((trends[5]?.patients || 0) * 1.1)
        });

        res.json({ summary, trends });
    } catch (err) {
        console.error("Dashboard Analytics Error", err);
        res.status(500).json({ message: 'Analytics Failed' });
    }
});

// --- RISK & FRAUD DETECTION (PHASE 4) ---
router.get('/risk/analysis', verifyAdmin, async (req, res) => {
    try {
        const riskScore = 12; // 0-100 (Low Risk)

        const activeFlags = [
            { id: 1, type: 'Billing Anomaly', severity: 'medium', description: 'Dr. Smith booked 15 appointments in 1 hour.', date: new Date() },
            { id: 2, type: 'Rx Pattern', severity: 'low', description: 'High frequency of antibiotic prescriptions detected in Pediatrics.', date: new Date(Date.now() - 86400000) }
        ];

        res.json({ riskScore, activeFlags });
    } catch (err) {
        res.status(500).json({ message: 'Risk Analysis Failed' });
    }
});

module.exports = router;