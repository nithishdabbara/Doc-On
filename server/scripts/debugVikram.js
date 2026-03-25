const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

const debugVikram = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const vikram = await Doctor.findOne({ name: { $regex: 'Vikram', $options: 'i' } });

        if (!vikram) {
            console.log('Dr. Vikram not found');
            return;
        }

        console.log(`Dr. Vikram (${vikram._id}) Stats: Avg ${vikram.averageRating}, Total ${vikram.totalRatings}`);

        const appts = await Appointment.find({ doctorId: vikram._id, rating: { $exists: true } });
        console.log(`Found ${appts.length} rated appointments for him.`);
        appts.forEach(a => console.log(` - Appt ${a._id}: Rating ${a.rating}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugVikram();
