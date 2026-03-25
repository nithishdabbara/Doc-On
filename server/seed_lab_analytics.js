const mongoose = require('mongoose');
const LabCentre = require('./models/LabCentre');
const LabBooking = require('./models/LabBooking');
// Minimal Patient Schema for finding Ids
const Patient = mongoose.model('Patient', new mongoose.Schema({ name: String }, { strict: false }));

require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Clear existing bookings if any (for clean slate)
        await LabBooking.deleteMany({});
        console.log('Cleared existing bookings.');

        const labs = await LabCentre.find({});
        // We need at least one patient. If none, create a dummy one.
        let patients = await Patient.find({});
        if (patients.length === 0) {
            const newPatient = new Patient({
                name: 'Test Patient',
                email: 'test@patient.com',
                password: 'password'
            });
            await newPatient.save();
            patients = [newPatient];
        }

        console.log(`Seeding data for ${labs.length} labs using ${patients.length} patients...`);

        const bookings = [];

        // Only seed for first 200 labs to save time, or random selection
        // Actually, let's seed a few bookings for EVERY lab to ensure "View Details" always has data?
        // No, that's too many (3500 * 5 = 17500).
        // Let's seed for 20% of labs randomly + specifically for the labs visible in user screenshots (Anantapur) if possible.
        // We will loop all labs but with 20% prob.

        for (const lab of labs) {
            if (Math.random() > 0.2) continue; // Skip 80% of labs

            const numBookings = Math.floor(Math.random() * 10) + 1; // 1-10 bookings

            for (let i = 0; i < numBookings; i++) {
                const patient = patients[Math.floor(Math.random() * patients.length)];

                // Pick Tests
                const labTests = lab.availableTestTypes || [];
                if (labTests.length === 0) continue;

                // Pick 1-3 tests
                const pickedTests = [];
                const numTests = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < numTests; j++) {
                    const t = labTests[Math.floor(Math.random() * labTests.length)];
                    // Handle String vs Object legacy safety (though we migrated)
                    if (typeof t === 'object') pickedTests.push(t);
                    else pickedTests.push({ testName: t, price: 500 });
                }

                const totalAmount = pickedTests.reduce((sum, t) => sum + (t.price || 0), 0);

                // Mode
                let mode = 'walk_in';
                if (lab.isHomeCollectionAvailable && Math.random() > 0.3) mode = 'home';

                const status = Math.random() > 0.2 ? 'completed' : 'scheduled';

                const daysAgo = Math.floor(Math.random() * 30);
                const date = new Date();
                date.setDate(date.getDate() - daysAgo);

                bookings.push({
                    patientId: patient._id,
                    labId: lab._id,
                    tests: pickedTests,
                    totalAmount,
                    collectionType: mode,
                    scheduledDate: date,
                    address: mode === 'home' ? '123 Fake St, City' : undefined,
                    status,
                    createdAt: date
                });
            }
        }

        await LabBooking.insertMany(bookings);
        console.log(`Successfully seeded ${bookings.length} bookings.`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

run();
