const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check file
        const dataFile = './Gujarat_Doctors_Final_NoDuplicateEmails.json';
        if (!fs.existsSync(dataFile)) {
            console.error(`Error: ${dataFile} not found.`);
            process.exit(1);
        }

        const data = fs.readFileSync(dataFile, 'utf-8');
        const doctors = JSON.parse(data);

        console.log(`Found ${doctors.length} doctors to import...`);

        // Load existing emails (Lowercase for robust check)
        const existingEmails = new Set((await Doctor.find({}, { email: 1 })).map(d => d.email.toLowerCase()));
        console.log(`Database currently has ${existingEmails.size} doctors.`);

        const doctorsToInsert = [];
        let skipped = 0;

        for (const doc of doctors) {
            let infoEmail = doc.Email || doc.DoctorName.toLowerCase().replace(/\s+/g, '.') + '@healthap.in';
            let cleanEmail = infoEmail.trim().toLowerCase();

            if (existingEmails.has(cleanEmail)) {
                skipped++;
                continue;
            }

            // Add to list (we use the original casing or normalized? Normalized is safer for login)
            doctorsToInsert.push({ ...doc, finalEmail: cleanEmail });
            // Add to set to prevent internal duplicates in this batch
            existingEmails.add(cleanEmail);
        }

        console.log(`Skipping ${skipped} existing doctors.`);
        console.log(`Preparing to insert ${doctorsToInsert.length} new doctors (Batch Mode)...`);

        if (doctorsToInsert.length === 0) {
            console.log('Nothing new to import.');
            process.exit();
        }

        const CHUNK_SIZE = 50;
        let processed = 0;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < doctorsToInsert.length; i += CHUNK_SIZE) {
            const chunk = doctorsToInsert.slice(i, i + CHUNK_SIZE);

            const preparedDocs = await Promise.all(chunk.map(async (doc) => {
                const hashedPassword = await bcrypt.hash(doc.Password || 'password123', 10);

                let license = doc.LicenceID;
                if (!license) {
                    const shortName = (doc.DoctorName || 'Doc').substring(0, 3).toUpperCase();
                    const rand = Math.floor(1000 + Math.random() * 9000);
                    license = `AP-${shortName}-${rand}`;
                }

                let pTreated = 0;
                if (doc['patients treated']) {
                    pTreated = parseInt(String(doc['patients treated']).replace(/,/g, ''));
                }
                if (!pTreated || isNaN(pTreated)) {
                    pTreated = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
                }

                return {
                    name: doc.DoctorName,
                    specialization: doc.Specialization,
                    email: doc.finalEmail,
                    password: hashedPassword,
                    licenseNumber: license,
                    phone: doc.Phone || '9876543210',
                    address: doc.Address ? `${doc['Hospital address'] || ''}, ${doc.Address}` : 'Andhra Pradesh, India',
                    hospitalAddress: doc['Hospital address'] || 'General Hospital',
                    medicalCouncil: doc['medical council'] || 'Medical Council',
                    experience: doc.experience || '5 Years',
                    patientsTreated: pTreated,
                    verificationStatus: 'pending',
                    availability: doc.Availability || '9:00 AM - 5:00 PM',
                    fees: doc.Fees || 500,
                    yearOfRegistration: new Date().getFullYear(),
                    isVerified: false
                };
            }));

            try {
                // ordered: false allows continuing even if duplicates found
                const result = await Doctor.insertMany(preparedDocs, { ordered: false });
                successCount += result.length;
            } catch (err) {
                // If error, some might have succeeded
                if (err.insertedDocs) {
                    successCount += err.insertedDocs.length;
                }
                if (err.writeErrors) {
                    failCount += err.writeErrors.length;
                    // console.error(`Batch Warning: ${err.writeErrors.length} duplicates/errors in this chunk.`);
                } else {
                    console.error('Batch Error:', err.message);
                }
            }

            processed += chunk.length;
            process.stdout.write(`Processed ${processed} / ${doctorsToInsert.length} (Success: ${successCount})\r`);
        }

        console.log(`\nImport Complete! Success: ${successCount}, Failed/Skipped (DB Error): ${failCount}`);
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDoctors();
