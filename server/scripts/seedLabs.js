const mongoose = require('mongoose');
const fs = require('fs');
const LabCentre = require('../models/LabCentre');
const LabTest = require('../models/LabTest');
require('dotenv').config();

// Connect to DB
mongoose.connect('mongodb://localhost:27017/healthcare')
    .then(async () => {
        console.log('Connected to MongoDB for Seeding Labs...');

        // 1. Seed Common Tests
        console.log('Seeding Common Tests...');
        await LabTest.deleteMany({});
        const commonTests = [
            { code: 'CBC', name: 'Complete Blood Count', category: 'Pathology', standardPrice: 400, prerequisites: 'None' },
            { code: 'LIPID', name: 'Lipid Profile', category: 'Pathology', standardPrice: 800, prerequisites: '12 Hours Fasting' },
            { code: 'HBA1C', name: 'HbA1c (Diabetes)', category: 'Pathology', standardPrice: 600, prerequisites: 'None' },
            { code: 'TFT', name: 'Thyroid Function Test', category: 'Pathology', standardPrice: 550, prerequisites: 'None' },
            { code: 'MRI_BRAIN', name: 'MRI Brain', category: 'Radiology', standardPrice: 5000, prerequisites: 'Remove metal objects' },
            { code: 'XRAY_CHEST', name: 'X-Ray Chest PA', category: 'Radiology', standardPrice: 500, prerequisites: 'None' },
            { code: 'VIT_D', name: 'Vitamin D Total', category: 'Pathology', standardPrice: 1200, prerequisites: 'None' },
            { code: 'LFT', name: 'Liver Function Test', category: 'Pathology', standardPrice: 700, prerequisites: 'None' }
        ];
        await LabTest.insertMany(commonTests);
        console.log('Tests seeded.');

        // 2. Seed Labs per City
        console.log('Reading Cities from Doctor Data...');
        const path = require('path');
        const jsonPath = path.join(__dirname, '../../server/All_India_Doctors.json'); // Adjusted for script location in server/scripts

        const doctorData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const cities = [...new Set(doctorData.map(d => d.City || d.District))].filter(c => c);

        console.log(`Found ${cities.length} unique cities/districts.`);

        await LabCentre.deleteMany({});
        const labs = [];

        const labNames = ['Diagnostics', 'Pathlabs', 'Health Center', 'Imaging Center', 'Clinical Lab'];

        cities.forEach(city => {
            // Create 5 labs per city
            for (let i = 0; i < 5; i++) {
                const nameSuffix = labNames[Math.floor(Math.random() * labNames.length)];
                labs.push({
                    name: `${city} ${nameSuffix} ${String.fromCharCode(65 + i)}`, // e.g. Anantapur Diagnostics A
                    city: city,
                    district: city, // Assuming City=District for simplicity in this dataset
                    address: `${Math.floor(Math.random() * 999)}, ${city} Main Road`,
                    contactNumber: `98${Math.floor(Math.random() * 100000000)}`,
                    isHomeCollectionAvailable: Math.random() > 0.3, // 70% chance of home collection
                    rating: (3.5 + Math.random() * 1.5).toFixed(1)
                });
            }
        });

        console.log(`Generating ${labs.length} Lab Centres...`);
        // Insert in chunks to avoid memory issues if too large, but <10k is fine for insertMany
        await LabCentre.insertMany(labs);
        console.log('Lab Centres seeded successfully!');

        mongoose.disconnect();
    })
    .catch(err => console.error(err));
