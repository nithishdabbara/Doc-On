const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const LabCentre = require('../models/LabCentre');
const LabTest = require('../models/LabTest');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const REQUIRED_LABS_PER_DISTRICT = 5;

// Helper Data
const LAB_SUFFIXES = ['Diagnostics', 'Pathlabs', 'Scan Centre', 'Imaging & Research', 'Clinical Lab', 'Polyclinic & Lab', 'MedCore'];
const LAB_TYPES = [
    { type: 'Pathology', keywords: ['Diagnostics', 'Pathlabs', 'Clinical Lab'] },
    { type: 'Radiology', keywords: ['Scan Centre', 'Imaging'] },
    { type: 'General', keywords: ['Health Center', 'Lab'] }
];

const SAMPLE_TESTS = {
    'Pathology': ['CBC', 'LIPID', 'HBA1C', 'TFT', 'VIT_D', 'LFT'],
    'Radiology': ['MRI_BRAIN', 'XRAY_CHEST']
};

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/docon');
        console.log('Connected.');

        // 1. Load District Data
        const jsonPath = path.join(__dirname, '../All_India_Doctors.json');
        if (!fs.existsSync(jsonPath)) {
            console.error('Error: All_India_Doctors.json not found in server root.');
            process.exit(1);
        }

        console.log('Reading Doctor Data...');
        const doctorData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        // Extract Unique Districts (and try to get State if possible, though strict mapping might be hard from flat JSON, we'll infer or keep generic)
        const districts = [...new Set(doctorData.map(d => d.City || d.District))].filter(Boolean);
        console.log(`Found ${districts.length} Unique Districts/Cities to seed.`);

        // 2. Clear Existing Labs? (Optional, maybe safety check)
        // await LabCentre.deleteMany({}); 
        // console.log('Cleared existing labs.');

        const labsToInsert = [];

        // 3. Generate Labs
        console.log('Generating Lab Data...');

        for (const district of districts) {
            // Generate 5 Labs for this district
            for (let i = 0; i < REQUIRED_LABS_PER_DISTRICT; i++) {

                // Randomly assign a "Primary Type" to influence name and services
                const primaryType = Math.random() > 0.6 ? 'Radiology' : 'Pathology'; // 40% Radio, 60% Path

                // Name Generation
                const suffix = LAB_SUFFIXES[Math.floor(Math.random() * LAB_SUFFIXES.length)];
                const name = `${district} ${suffix} ${String.fromCharCode(65 + i)}`; // e.g., "Anantapur Diagnostics A"

                // Contact Details
                const contactNumber = `9${Math.floor(Math.random() * 900000000 + 100000000)}`;
                const email = `contact.${name.replace(/\s+/g, '').toLowerCase().slice(0, 15)}@gmail.com`;

                // Services
                let availableTestTypes = [];
                if (name.includes('Scan') || name.includes('Imaging') || primaryType === 'Radiology') {
                    availableTestTypes.push('Radiology');
                    if (Math.random() > 0.5) availableTestTypes.push('Pathology'); // Some do both
                } else {
                    availableTestTypes.push('Pathology');
                }

                labsToInsert.push({
                    name: name,
                    address: `${Math.floor(Math.random() * 100)}, Hospital Road, ${district}`,
                    city: district,
                    district: district,
                    state: "India", // Placeholder as dataset might be flat
                    contactNumber: contactNumber,
                    email: email,
                    website: `www.${name.replace(/\s+/g, '').toLowerCase()}.com`,
                    availableTestTypes: availableTestTypes,
                    isHomeCollectionAvailable: Math.random() > 0.4,
                    rating: (3.8 + Math.random() * 1.2).toFixed(1) // 3.8 to 5.0
                });
            }
        }

        console.log(`Prepared ${labsToInsert.length} Lab Records.`);

        // 4. Batch Insert (Chunks of 500 to be safe)
        const CHUNK_SIZE = 500;
        for (let i = 0; i < labsToInsert.length; i += CHUNK_SIZE) {
            const chunk = labsToInsert.slice(i, i + CHUNK_SIZE);
            await LabCentre.insertMany(chunk);
            process.stdout.write(`.`);
        }

        console.log('\nSeed Complete! Database Populated with Labs.');
        process.exit(0);

    } catch (err) {
        console.error('Seeding Failed:', err);
        process.exit(1);
    }
}

seed();
