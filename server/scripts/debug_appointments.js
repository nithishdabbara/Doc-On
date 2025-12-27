const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../models/Appointment');
const User = require('../models/User');

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        const appts = await Appointment.find({});
        console.log(`Found ${appts.length} appointments.`);

        for (const a of appts) {
            console.log(`--- Appt ${a._id} ---`);
            console.log('Doctor ID stored:', a.doctor);
            const docUser = await User.findById(a.doctor);
            console.log('Doctor User Found?', !!docUser, docUser?.name);

            console.log('Patient ID stored:', a.patient);
            const patUser = await User.findById(a.patient);
            console.log('Patient User Found?', !!patUser, patUser?.name);

            if (!docUser || !patUser) console.log('>>> ALARM: ORPHANED APPOINTMENT');
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

check();
