const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const fs = require('fs'); // Import FS
const { verifyToken } = require('../middleware/auth');
const AIService = require('../services/AIService');




// Get Patient Profile (for Doctors)
router.get('/patient-profile/:id', verifyToken, async (req, res) => {
    try {
        let patient = await Patient.findById(req.params.id).select('-password');
        
        // Fallback for test data: if a doctor or admin was used to book the appointment
        if (!patient) {
            patient = await Doctor.findById(req.params.id).select('-password');
        }
        if (!patient) {
            const Admin = require('../models/Admin');
            patient = await Admin.findById(req.params.id).select('-password');
        }

        if (!patient) return res.status(404).json({ message: 'Patient not found' });
        res.json(patient);
    } catch (err) {
        console.error("Patient Profile Error:", err);
        res.status(500).json({ message: 'Server error' });
    }
});

console.log('[DEBUG] Loading Doctor Routes...');

// Analyze Symptoms (AI Chatbot) - MOVED TO TOP
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Analyze Document (Multimodal AI Stub)
// Analyze Document (Orchestrated)
router.post('/analyze-document', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const prompt = req.body.prompt || "";
        // Default to doctor role for this route, but allow override
        const role = req.body.role || 'doctor';

        if (!file) return res.status(400).json({ message: "No file uploaded" });

        const result = await AIService.routeRequest({
            role: role,
            task: 'analyze_document',
            prompt: prompt,
            imageBuffer: file.buffer, // Buffer from multer
            mimeType: file.mimetype,
            context: role === 'doctor' ? 'clinical_support' : 'record_review'
        });

        // result is already formatted by the Expert or Orchestrator
        // If it's a string (legacy fallback), wrap it
        if (typeof result === 'string') {
            return res.json({ message: result });
        }

        // Return full object directly (Orchestrator returns structured data)
        // Add a message field for the frontend if missing
        if (!result.message && result.summary) {
            result.message = `**Analysis**: ${result.summary}`;
            
            // Map parsed fields to actionable UI suggestions for the doctor
            let allSuggestions = [];
            if (result.differential_diagnosis && result.differential_diagnosis.length) allSuggestions.push(...result.differential_diagnosis);
            if (result.treatment_plan && result.treatment_plan.length) allSuggestions.push(...result.treatment_plan);
            if (result.rx && result.rx.length) allSuggestions.push(...result.rx);
            if (result.precautions && result.precautions.length) allSuggestions.push(...result.precautions);
            
            result.suggestions = allSuggestions;
        }

        res.json(result);

    } catch (err) {
        console.error("Analysis Error:", err);
        res.status(500).json({ message: "Analysis Failed" });
    }
});

// Get Current Doctor Profile
router.get('/me', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Access Denied' });
        const doctor = await Doctor.findById(req.user.id).select('-password');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Doctor Profile
router.put('/me', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Access Denied' });
        
        const updates = {
            name: req.body.name,
            specialization: req.body.specialization,
            consultationFee: req.body.consultationFee,
            licenseNumber: req.body.licenseNumber,
            experience: req.body.experience,
            availability: req.body.availability,
            address: req.body.address,
            phone: req.body.phone
        };

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        const doctor = await Doctor.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
        res.json(doctor);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Generate Prescription PDF (AI Expert)
router.post('/generate-prescription', async (req, res) => {
    try {
        const prescriptionData = req.body; // { doctor, patient, meds: [], ... }

        // Delegate to PrescriptionAI via Orchestrator
        // Note: routeRequest for 'generate_prescription' expects response object to pipe PDF
        await AIService.routeRequest({
            task: 'generate_prescription',
            data: prescriptionData,
            res: res // Pass response object for streaming
        });
        // No res.json() here because generatePDF handles the stream

    } catch (err) {
        console.error("Prescription Gen Error:", err);
        if (!res.headersSent) res.status(500).json({ message: "PDF Generation Failed" });
    }
});

// --- Safety AI: Drug Interaction Check ---
const { checkInteraction } = require('../utils/drugInteractions');

router.post('/check-interactions', async (req, res) => {
    try {
        const { drugs } = req.body; // Array of drug names
        if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
            return res.json({ safe: true, interactions: [] });
        }

        const interactions = [];
        // Compare every pair
        for (let i = 0; i < drugs.length; i++) {
            for (let j = i + 1; j < drugs.length; j++) {
                const result = checkInteraction(drugs[i], drugs[j]);
                if (result) interactions.push(result);
            }
        }

        res.json({
            safe: interactions.length === 0,
            interactions: interactions,
            message: interactions.length > 0
                ? `WARNING: ${interactions.length} interaction(s) detected.`
                : "No known interactions found."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Safety Check Failed" });
    }
});

// --- Smart AI Expert System Stub ---
const { getRelatedSpecializations } = require('../utils/symptomMapping');

/*
// Commented out as AIService is now used
const generateSmartAnalysis = (text) => {
    const t = text.toLowerCase();
    let result = {
        found: false,
        summary: "General health query or document",
        spec: "General Physician",
        urgency: "Low",
        precautions: ["Maintain a healthy lifestyle", "Annual checkups recommended"],
        clinical: "No specific clinical indicators found.",
        rx: [] // Prescription Suggestions
    };

    // 1. Blood Pressure / Hypertension
    // 1. Blood Pressure / Hypertension
    // Regex: Matches 120/80 but IGNORES dates like 12/31/2025 (lookahead for no slash)
    if (t.includes('bp') || t.includes('pressure') || t.includes('hypertension') || t.match(/\b\d{2,3}\/\d{2,3}(?!\/)\b/)) {
        result = {
            found: true,
            summary: "Blood Pressure / Hypertension related indicators detected.",
            spec: "Cardiologist",
            urgency: t.includes('high') || t.includes('pain') ? "High" : "Medium",
            precautions: [
                "Reduce salt intake (<5g/day).",
                "Regular aerobic exercise (walking/swimming).",
                "Monitor BP daily at the same time.",
                "Manage stress through meditation or yoga."
            ],
            clinical: "Possible hypertension. Values should be correlated with clinical symptoms like headache or dizziness.",
            rx: ["Tab Telmisartan 40mg (OD)", "Tab Amlodipine 5mg (OD)", "Cap Ramipril 2.5mg"]
        };
    }
    // ...
    // 11. Fever / General / Common Meds
    else if (t.includes('fever') || t.includes('cold') || t.includes('flu') || t.includes('cough') || t.includes('temp') || t.includes('dolo') || t.includes('paracetamol') || t.includes('crocin')) {
        result = {
            found: true,
            summary: "Blood Glucose / Diabetes indicators detected.",
            spec: "Endocrinologist",
            urgency: t.includes('high') || t.includes('dizzy') ? "High" : "Medium",
            precautions: [
                "Avoid sugary foods and refined carbs.",
                "Include fiber-rich foods in your diet.",
                "Regular foot care to prevent infections.",
                "Monitor active blood glucose levels."
            ],
            clinical: "Glycemic control markers detected. Evaluation for Diabetes Mellitus recommended.",
            rx: ["Tab Metformin 500mg SR (BD)", "Tab Sitagliptin 100mg (OD)", "Tab Glimepiride 1mg"]
        };
    }
    // 3. Lipid Profile / Cholesterol
    else if (t.includes('cholesterol') || t.includes('lipid') || t.includes('triglyceride') || t.includes('ldl') || t.includes('hdl')) {
        result = {
            found: true,
            summary: "Dyslipidemia / High Cholesterol indicators.",
            spec: "Cardiologist",
            urgency: "Medium",
            precautions: [
                "Avoid saturated fats and deep-fried foods.",
                "Increase intake of omega-3 rich foods.",
                "Regular cardio exercise (30 mins/day).",
                "Stop smoking/alcohol consumption."
            ],
            clinical: "Abnormal lipid profile detected. Risk of atherosclerosis. Statin therapy may be indicated.",
            rx: ["Tab Atorvastatin 10mg (HS)", "Tab Rosuvastatin 20mg", "Cap Fenofibrate 160mg"]
        };
    }
    // 4. Thyroid Profile
    else if (t.includes('thyroid') || t.includes('tsh') || t.includes('t3') || t.includes('t4')) {
        result = {
            found: true,
            summary: "Thyroid Function Test (TFT) indicators.",
            spec: "Endocrinologist",
            urgency: "Medium",
            precautions: [
                "Take medication on an empty stomach.",
                "Monitor weight changes regularly.",
                "Avoid high-stress environments.",
                "Regular follow-up for TSH levels."
            ],
            clinical: "Thyroid function abnormalities suggested (Hypo/Hyper). TSH correlation required.",
            rx: ["Tab Thyronorm 25mcg (Empty Stomach)", "Tab Eltroxin 50mcg", "Tab Neomercazole 5mg (Hyper)"]
        };
    }
    // 5. Liver Function Test (LFT)
    else if (t.includes('liver') || t.includes('sgot') || t.includes('sgpt') || t.includes('bilirubin') || t.includes('jaundice')) {
        result = {
            found: true,
            summary: "Liver Function Test (LFT) Abnormalities.",
            spec: "Gastroenterologist",
            urgency: "Medium",
            precautions: [
                "Complete alcohol abstinence.",
                "Drink plenty of water and cane juice.",
                "Restrict protein and fatty food intake.",
                "Rest is essential for recovery."
            ],
            clinical: "Hepatic marker elevation (Transaminases/Bilirubin). Rule out Viral Hepatitis or drug-induced injury.",
            rx: ["Tab Udiliv 300mg (Ursocol) (BD)", "Syp Liv-52 2tsp (TDS)", "Tab Pan 40mg (OD)"]
        };
    }
    // 6. Kidney Function Test (KFT)
    else if (t.includes('kidney') || t.includes('creatinine') || t.includes('urea') || t.includes('uric') || t.includes('renal')) {
        result = {
            found: true,
            summary: "Renal Function / Kidney indicators.",
            spec: "Nephrologist",
            urgency: t.includes('high') ? "High" : "Medium",
            precautions: [
                "Monitor fluid intake strictly.",
                "Low protein and low potassium diet.",
                "Avoid NSAID painkillers.",
                "Monitor BP regularly."
            ],
            clinical: "Renal impairment markers (Creatinine/Urea). evaluation for CKD or AKI required.",
            rx: ["Tab Febuxostat 40mg (if Uric Acid)", "Inj Lasix 20mg (Diuretic)", "Referral to Nephrology"]
        };
    }
    // 7. Blood Report / CBC
    else if (t.includes('blood') || t.includes('cbc') || t.includes('hemoglobin') || t.includes('platelet')) {
        result = {
            found: true,
            summary: "Hematology / Blood Report Analysis.",
            spec: "General Physician",
            urgency: "Medium",
            precautions: [
                "Stay well hydrated.",
                "Ensure iron-rich diet (spinach, dates) if weak.",
                "Avoid strenuous activity if feeling fatigued."
            ],
            clinical: "CBC parameters analyzed. specific focus on Hemoglobin and WBC counts required.",
            rx: ["Cap Autrin (Iron/Folic Acid) (OD)", "Tab Limcee 500mg (Vit C)", "Multivitamin Tab"]
        };
    }
    // 8. X-Ray / Ortho
    else if (t.includes('xray') || t.includes('x-ray') || t.includes('fracture') || t.includes('bone') || t.includes('pain') || t.includes('joint')) {
        result = {
            found: true,
            summary: "Radiological / Musculoskeletal Analysis.",
            spec: "Orthopedist",
            urgency: t.includes('fracture') ? "High" : "Medium",
            precautions: [
                "Rest the affected area immediately (RICE).",
                "Apply ice packs to reduce swelling.",
                "Avoid heavy lifting or strain.",
                "Use support brace/crepe bandage if needed."
            ],
            clinical: "Radiological evidence suggests potnetial bone or soft tissue injury. Clinical correlation advised.",
            rx: ["Tab Zerodol-P (Aceclofenac/Para) (BD)", "Gel Volini Application (TDS)", "Tab Chymoral Forte (Swelling) (TDS)"]
        };
    }
    // 9. Skin / Derm
    else if (t.includes('skin') || t.includes('rash') || t.includes('acne') || t.includes('hair') || t.includes('derm') || t.includes('shampoo')) {
        result = {
            found: true,
            summary: "Dermatological / Hair Care Issue Detected.",
            spec: "Dermatologist",
            urgency: "Low",
            precautions: [
                "Avoid scratching or touching the area.",
                "Keep the area clean and dry.",
                "Avoid direct sunlight / use sunscreen.",
                "Use gentle, fragrance-free cleansers."
            ],
            clinical: "Cutaneous presentation observed. Differential diagnosis includes dermatitis or fungal infection.",
            rx: ["Tab Levocetirizine 5mg (HS)", "Cream Fusidic Acid (Antibiotic)", "Loc Calamine Application"]
        };
    }
    // 10. Stomach / Gastro
    else if (t.includes('stomach') || t.includes('abdomen') || t.includes('digestion') || t.includes('gastric') || t.includes('vomit')) {
        result = {
            found: true,
            summary: "Gastrointestinal Issue Detected.",
            spec: "Gastroenterologist",
            urgency: t.includes('severe') || t.includes('blood') ? "High" : "Medium",
            precautions: [
                "Drink plenty of water and clear fluids.",
                "Avoid spicy, oily, or fried foods.",
                "Eat smaller, frequent meals (BRAT diet).",
                "Consult a specialist if pain persists > 24hrs."
            ],
            clinical: "Abdominal/GI symptoms reported. Rule out Gastritis, GERD, or Infection.",
            rx: ["Cap Pan 40mg (OD Empty Stomach)", "Syp Gelusil 10ml (TDS)", "Tab Ondem 4mg (Vomiting)"]
        };
    }
    // 11. Fever / General
    // 11. Fever / General / Common Meds
    else if (t.includes('fever') || t.includes('cold') || t.includes('flu') || t.includes('cough') || t.includes('temp') || t.includes('dolo') || t.includes('paracetamol') || t.includes('crocin')) {
        result = {
            found: true,
            summary: "Viral / General Infection Symptoms.",
            spec: "General Physician",
            urgency: t.includes('high') ? "High" : "Medium",
            precautions: [
                "Complete rest and isolation.",
                "Drink plenty of warm fluids.",
                "Monitor temperature every 4 hours.",
                "Steam inhalation for congestion."
            ],
            clinical: "Febrile illness symptoms. Viral etiology suspected. Watch for secondary bacterial infection.",
            rx: ["Tab Dolo 650mg (Paracetamol) (TDS)", "Tab Cetirizine 10mg (HS)", "Syp Alex (Cough)"]
        };
    }
    // 12. Fallback: Fuzzy Search (Symptom Mapping)
    else {
        const fuzzy = getRelatedSpecializations(text);
        if (fuzzy.found) {
            result = {
                found: true,
                summary: `Symptoms matched with ${fuzzy.primaryMatch} conditions.`,
                spec: fuzzy.primaryMatch,
                urgency: fuzzy.urgency || "Medium",
                precautions: fuzzy.precautions || ["Consult a specialist."],
                clinical: `Symptom cluster analysis indicates potential ${fuzzy.primaryMatch} related pathology.`,
                rx: [`Referral to ${fuzzy.primaryMatch}`, "Symptomatic Treatment"]
            };
        }
    }

    // Append Referral if High Urgency
    if (result.urgency === "High") {
        result.clinical += " URGENT REFERRAL ADVISED.";
        result.rx.push("Emergency Department Referral");
    }

    return result;
};
*/

router.post('/analyze-symptoms', async (req, res) => {
    try {
        const { query, context } = req.body;
        if (!query) return res.status(400).json({ message: "Query required" });

        // Use AI Service
        const analysis = await AIService.analyzeText(query, context);

        // Customize Message based on Context
        let message = `**Analysis**: ${analysis.summary}\n\nBased on these findings, we recommend consulting a **${analysis.spec}**.\n\n**Precautions**:\n${analysis.precautions.map(p => `- ${p}`).join('\n')}`;

        if (context === 'record_review') {
            message = `**Record Analysis** 📋\n\n- **Findings**: ${analysis.summary}\n- **Specialist Context**: ${analysis.spec}\n\n**Precautions**:\n${analysis.precautions.map(p => `- ${p}`).join('\n')}\n\n*Note: Follow the advice given in this record/prescription.*`;
        }

        res.json({
            found: true,
            specializations: [analysis.spec],
            precautions: analysis.precautions,
            urgency: analysis.urgency,
            suggestions: analysis.rx, // AI Prescription Suggestions
            message: message
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// New: Food as Medicine (Nutrition Plan)
router.post('/analyze-nutrition', verifyToken, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const LabBooking = require('../models/LabBooking');
        const LabTest = require('../models/LabTest');

        const booking = await LabBooking.findById(bookingId).populate('tests');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Construct Content Query
        // 1. Digital Results
        let resultData = "";
        if (booking.results && booking.results.length > 0) {
            resultData = booking.results.map(r => `${r.parameter}: ${r.value} ${r.unit}`).join(', ');
        }

        // 2. Test Names (Fallback if PDF only)
        const testNames = booking.tests.map(t => t.name).join(', ');

        const prompt = `Patient Findings: ${resultData ? resultData : 'Available Report only (PDF). Test Type: ' + testNames}. Please generate a diet plan.`;

        const plan = await AIService.analyzeText(prompt, 'nutrition_plan');

        res.json(plan);
    } catch (err) {
        console.error("Nutrition Analysis Error:", err);
        res.status(500).json({ message: "Failed to generate nutrition plan" });
    }
});

// New: Food as Medicine (Nutrition Plan)
router.post('/analyze-nutrition', verifyToken, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const LabBooking = require('../models/LabBooking');
        const LabTest = require('../models/LabTest');

        const booking = await LabBooking.findById(bookingId).populate('tests');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Construct Content Query
        // 1. Digital Results
        let resultData = "";
        if (booking.results && booking.results.length > 0) {
            resultData = booking.results.map(r => `${r.parameter}: ${r.value} ${r.unit}`).join(', ');
        }

        // 2. Test Names (Fallback if PDF only)
        const testNames = booking.tests.map(t => t.name).join(', ');

        const prompt = `Patient Findings: ${resultData ? resultData : 'Available Report only (PDF). Test Type: ' + testNames}. Please generate a diet plan.`;

        const plan = await AIService.analyzeText(prompt, 'nutrition_plan');

        res.json(plan);
    } catch (err) {
        console.error("Nutrition Analysis Error:", err);
        res.status(500).json({ message: "Failed to generate nutrition plan" });
    }
});

// Doctor Registration
// Patient imported at the top

router.post('/register', async (req, res) => {
    const { name, email, password, specialization, consultationFee, licenseNumber, medicalCouncil, experience, address, phone, patientsTreated } = req.body;

    // Check if exists
    const existing = await Doctor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDoctor = new Doctor({
        name,
        email,
        password: hashedPassword,
        specialization,
        consultationFee,
        licenseNumber,
        medicalCouncil,
        experience,
        address,
        phone,
        patientsTreated: patientsTreated || (Math.floor(Math.random() * 901) + 100),
        verificationStatus: 'pending'
    });

    try {
        await newDoctor.save();

        // Real-Time Stats Update
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

        res.status(201).json({ message: 'Registration successful. Waiting for Admin verification.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error registering doctor' });
    }
});

// Search Public (Approved only, with Filters)

// Get Unique Specializations
router.get('/specializations', async (req, res) => {
    try {
        const specs = await Doctor.distinct('specialization', { verificationStatus: 'approved' });
        res.json(specs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

const LabCentre = require('../models/LabCentre'); // Import Lab Model

// Get Platform Stats (Public)
router.get('/stats', async (req, res) => {
    try {
        const doctorCount = await Doctor.countDocuments({ verificationStatus: 'approved' });
        const specialtyCount = (await Doctor.distinct('specialization', { verificationStatus: 'approved' })).length;
        const patientCount = await Patient.countDocuments();
        const labCount = await LabCentre.countDocuments({ verificationStatus: 'approved' }); // Count Approved Labs

        // Return rounded numbers for "10k+" style if needed, or raw
        res.json({
            doctors: doctorCount,
            specialties: specialtyCount,
            patients: patientCount,
            labs: labCount
        });
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/public', async (req, res) => {
    try {
        const { search, location } = req.query;
        // Initialize query object
        let query = { verificationStatus: 'approved' }; // Ensure only approved doctors are searched

        // 1. Text Search (Name, Specialization, Symptoms)
        if (search) {
            const analysis = getRelatedSpecializations(search);
            const relatedSpecializations = analysis.specializations || [];
            const regex = new RegExp(search, 'i');

            // Use $and to ensure keyword match IS required
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: regex },
                    { specialization: regex },
                    { specialization: { $in: relatedSpecializations } },
                    { hospitalName: regex }
                ]
            });
        }

        // 2. Location Search
        if (location) {
            const locRegex = new RegExp(location, 'i');

            // Use $and to ensure location match IS ALSO required
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { address: locRegex },
                    { city: locRegex },
                    { state: locRegex }
                ]
            });
        }

        // 3. Filter: Fees
        if (req.query.minFee || req.query.maxFee) {
            query.consultationFee = {};
            if (req.query.minFee) query.consultationFee.$gte = parseInt(req.query.minFee);
            if (req.query.maxFee) query.consultationFee.$lte = parseInt(req.query.maxFee);
        }

        // 4. Filter: Experience (String parsing: "14 Years" -> 14)
        // We use $regex to match range because experience is stored as string.
        // For accurate range, we ideally need a number field. 
        // For now, we will use a basic regex approach for common ranges if possible, 
        // OR filtering after fetch if dataset is small (but we have 28k).
        // Better approach for string "10 Years": Use $expr with $toInt parsing (requires aggregation)
        // Fallback: Since this is a demo, we might skip complex range on string or rely on simple string match?
        // Let's use a simpler heuristic: if user wants >10, we match strings starting with 1, 2, 3... (digits)
        // Actually, $expr is best.

        // 5. Filter: Gender (Heuristic on Name)
        if (req.query.gender) {
            const isFemale = req.query.gender.toLowerCase() === 'female';
            // Simple heuristic: Female names end in a, i, ee.
            // Male exception: 'Sai', 'Ravi', etc.
            const maleExceptions = ['sai', 'ravi', 'hari', 'aditya', 'krishna', 'raja', 'arjun', 'om', 'ali'];
            const femaleRegex = /(a|i|ee)$/i;

            // Note: This isn't perfect in a DB query.
            // For true accuracy we need a gender field.
            // We will attempt a regex match.
            if (isFemale) {
                query.name = { $regex: /(a|i|ee)$/i }; // Ends in valid female suffix
                // We can't easily exclude male exceptions in a simple regex without complex Lookahead.
                // We will verify this works reasonably well.
            } else {
                // Male: Not ending in female suffix
                query.name = { $not: { $regex: /(a|i|ee)$/i } };
            }
        }

        // Execution
        // Note: For experience, converting string "15 Years" to number in find() is hard.
        // We will fetch slightly more docs and filter experience in JS for accuracy if filter is applied.
        let doctors = await Doctor.find(query).limit(100); // Fetch 100 to allow filtering

        // JS Filtering for Experience (Robustness)
        if (req.query.minExp || req.query.maxExp) {
            const min = parseInt(req.query.minExp || 0);
            const max = parseInt(req.query.maxExp || 100);
            doctors = doctors.filter(doc => {
                const expYears = parseInt(doc.experience) || 0; // "14 Years" -> 14
                return expYears >= min && expYears <= max;
            });
        }

        // Limit to 50 for performance
        res.json(doctors.slice(0, 50));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Single Doctor Profile (Public) - Must be after specific routes like /public, /appointments
router.get('/:id', async (req, res, next) => {
    // Check if it's a special route that fell through (though they should be defined above)
    if (req.params.id === 'appointments' || req.params.id === 'public') return next();

    try {
        const doctor = await Doctor.findById(req.params.id).select('-password');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json(doctor);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Doctor not found' });
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Booked Slots for a Date (Public)
router.get('/:id/booked-slots', async (req, res) => {
    try {
        const { date } = req.query; // YYYY-MM-DD
        if (!date) return res.status(400).json({ message: 'Date required' });

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            doctorId: req.params.id,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' }
        }).select('date');

        // Return array of ISO strings
        const bookedTimes = appointments.map(appt => appt.date.toISOString());
        res.json(bookedTimes);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Doctor Reviews (Public & Anonymized)
router.get('/:id/reviews', async (req, res) => {
    try {
        const doctorId = req.params.id;
        // Fetch appointments that have a review
        const appointments = await Appointment.find({
            doctorId: doctorId,
            status: 'completed',
            review: { $exists: true, $ne: "" } // Only where review exists
        }).select('patientName rating review date');

        // Anonymize Logic
        const anonymousReviews = appointments.map(appt => {
            const name = appt.patientName || 'Anonymous';
            const maskedName = name.length > 2
                ? `${name[0]}***${name[name.length - 1]}`
                : 'Anonymous';

            return {
                _id: appt._id,
                maskedName,
                rating: appt.rating,
                review: appt.review,
                date: appt.date
            };
        });

        res.json(anonymousReviews);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Google Places Proxy (Example)
router.post('/google-places', async (req, res) => {
    const { query, location } = req.body;
    if (!process.env.GOOGLE_PLACES_API_KEY) return res.status(500).json({ message: 'API Key missing' });

    // Logic to call Google Maps API would go here
    // For now returning mock
    res.json({ results: [] });
});

// Get My Appointments (Doctor Dashboard)
router.get('/appointments', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Access Denied' });

        // Fetch appointments for this doctor
        const appointments = await Appointment.find({ doctorId: req.user.id })
            .populate('patientId', 'dob gender')
            .sort({ date: 1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Complete Treatment (Update Appointment with Files)
router.put('/appointments/:id/complete', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Access Denied' });

        const { treatmentNotes, attachments } = req.body; // attachments = array of URLs
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (appointment.doctorId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        appointment.status = 'completed';
        appointment.treatmentNotes = treatmentNotes;
        if (attachments) appointment.doctorAttachments = attachments; // Save uploaded files

        await appointment.save();

        res.json({ message: 'Treatment Completed', appointment });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update Appointment Status (Arrived, No Show, etc.)
router.put('/appointments/:id/status', verifyToken, async (req, res) => {
    console.log(`[Status Update] Request for ID: ${req.params.id}, Status: ${req.body.status}`);
    console.log(`[Status Update] User: ${req.user.id}, Type: ${req.user.type}`);

    try {
        if (req.user.type !== 'doctor') {
            console.log('[Status Update] Access Denied: Not a doctor');
            return res.status(403).json({ message: 'Access Denied' });
        }

        const { status } = req.body;
        const validStatuses = ['scheduled', 'arrived', 'in_progress', 'no_show', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.log(`[Status Update] Invalid Status: ${status}`);
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            console.log('[Status Update] Appointment not found');
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user.id) {
            console.log(`[Status Update] Unauthorized: DocID ${appointment.doctorId} !== UserID ${req.user.id}`);
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();
        console.log(`[Status Update] Success: ${status}`);

        res.json({ message: 'Status updated', appointment });
    } catch (err) {
        console.error('[Status Update] Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Get Financial Stats (Net Revenue)
router.get('/financials', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Access Denied' });

        const mongoose = require('mongoose'); // Ensure mongoose is available or use existing import

        const stats = await Appointment.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(req.user.id), paymentStatus: 'paid' } },
            {
                $group: {
                    _id: null,
                    // Use providerAmount if exists, else fallback to 85% of amount
                    totalEarnings: { $sum: { $ifNull: ["$providerAmount", { $multiply: ["$amount", 0.85] }] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent Transactions
        const history = await Appointment.find({ doctorId: req.user.id, paymentStatus: 'paid' })
            .select('date amount providerAmount patientName')
            .sort({ date: -1 })
            .limit(20);

        // Sanitize history to show ONLY Net Revenue
        const sanitizedHistory = history.map(h => {
            const net = h.providerAmount !== undefined ? h.providerAmount : (h.amount ? h.amount * 0.85 : 0);
            return {
                _id: h._id,
                date: h.date,
                patientName: h.patientName,
                amount: Math.floor(net), // Show Net
                isNet: true
            };
        });

        res.json({
            earnings: Math.floor(stats[0]?.totalEarnings || 0),
            completedCount: stats[0]?.count || 0,
            history: sanitizedHistory
        });

    } catch (err) {
        console.error("Financials Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get Patient Profile (Protected: Only if Doctor has appointment with this patient)
// Get Patient Profile (Protected: Only if Doctor has appointment with this patient)
router.get('/patient-profile/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.type !== 'doctor') return res.status(403).json({ message: 'Access Denied' });

        const patientId = req.params.id;

        // Check for ANY appointment relationship
        const relation = await Appointment.findOne({
            doctorId: req.user.id,
            patientId: patientId
        });

        if (!relation) {
            return res.status(403).json({ message: 'Access Denied: You do not have an appointment with this patient.' });
        }

        const patient = await Patient.findById(patientId).select('-password -otp -otpExpires');
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        res.json(patient);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});



// Rate Doctor
router.post('/appointments/:id/rate', verifyToken, async (req, res) => {
    try {
        const { rating, review } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Update Appointment
        appointment.rating = rating;
        appointment.review = review;
        await appointment.save();

        // Update Doctor Average
        // Update Doctor Average (Robust Aggregation)
        const stats = await Appointment.aggregate([
            { $match: { doctorId: appointment.doctorId, rating: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$doctorId",
                    avgRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            await Doctor.findByIdAndUpdate(appointment.doctorId, {
                averageRating: stats[0].avgRating.toFixed(1),
                totalRatings: stats[0].totalRatings
            });
        }

        res.json({
            message: 'Rating submitted',
            averageRating: stats.length > 0 ? stats[0].avgRating.toFixed(1) : rating
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
