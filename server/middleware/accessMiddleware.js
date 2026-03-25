const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

const checkDoctorAccess = async (req, res, next) => {
    try {
        // 1. Admins: Deny Medical Access (Data Minimization)
        if (req.user.type === 'admin') {
            // Admins can manage users but SHOULD NOT see medical data
            return res.status(403).json({ message: 'Access Denied: Admins cannot view medical data.' });
        }

        // 2. Patients: Strict Self-Access Only
        if (req.user.type === 'patient') {
            // "me" routes handle self-id. For explicit IDs, check match.
            const targetId = req.params.id || req.params.patientId;
            if (targetId && targetId !== req.user.id) {
                return res.status(403).json({ message: 'Access Denied' });
            }
            return next();
        }

        // 3. Doctors: The "Need-to-Know" Logic
        if (req.user.type === 'doctor') {
            const patientId = req.params.id || req.params.patientId;
            const doctorId = req.user.id;

            if (!patientId) return res.status(400).json({ message: 'Target Patient ID missing' });

            // CHECK 1: Active Appointment?
            // "scheduled" or "confirmed" means active. "completed" or "cancelled" means inactive.
            const activeAppointment = await Appointment.findOne({
                doctorId: doctorId,
                patientId: patientId,
                status: { $in: ['scheduled', 'confirmed'] }
            });

            if (activeAppointment) {
                req.accessLevel = 'full'; // Can see shared records + own records
                return next();
            }

            // CHECK 2: Historical Access (Own Treatments Only)
            // If no active appointment, Doctor can ONLY see records *they* created.
            req.accessLevel = 'limited'; // Controller must filter results
            return next();
        }

        res.status(403).json({ message: 'Unauthorized' });

    } catch (err) {
        console.error('Access Control Error:', err);
        res.status(500).json({ message: 'Server Error during Access Check' });
    }
};

module.exports = { checkDoctorAccess };
