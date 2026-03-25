const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const deepDebug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Find ANY appointment with a rating
        const ratedAppts = await Appointment.find({ rating: { $gt: 0 } }).limit(5);
        console.log(`Found ${ratedAppts.length} rated appointments globally.`);

        for (const appt of ratedAppts) {
            console.log(`Appt ${appt._id} has rating: ${appt.rating}. DoctorID: ${appt.doctorId}`);
            const doc = await Doctor.findById(appt.doctorId);
            if (doc) {
                console.log(` -> Linked Doctor: ${doc.name} (ID: ${doc._id})`);
            } else {
                console.log(` -> Linked Doctor NOT FOUND!`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

deepDebug();
