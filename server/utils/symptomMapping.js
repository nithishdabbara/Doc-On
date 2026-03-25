const Fuse = require('fuse.js');

const symptomMap = [
    {
        specialization: "General Physician",
        keywords: [
            "whole body", "internal organs", "general health",
            "fever", "fatigue", "headache", "weakness", "body pain", "cold", "cough", "mild chest pain", "digestion issues",
            "viral fever", "flu", "infections", "diabetes", "hypertension", "thyroid issues", "anemia"
        ],
        precautions: [
            "Stay hydrated and rest.",
            "Monitor your temperature regularly.",
            "Avoid self-medication if symptoms persist."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Cardiologist",
        keywords: [
            "heart", "blood vessels",
            "chest pain", "breathlessness", "palpitations", "dizziness", "swelling in legs",
            "heart attack", "coronary artery disease", "arrhythmia", "heart failure", "hypertension", "valve disorders"
        ],
        precautions: [
            "Avoid physical exertion immediately.",
            "Sit or lie down in a comfortable position.",
            "If chest pain is severe, seek emergency help."
        ],
        urgency: "High"
    },
    {
        specialization: "Dentist",
        keywords: [
            "teeth", "gums", "jaw", "oral cavity",
            "tooth pain", "bleeding gums", "bad breath", "swelling", "broken tooth",
            "dental cavities", "gingivitis", "periodontitis", "root infection", "oral cysts"
        ],
        precautions: [
            "Rinse mouth with warm salt water.",
            "Avoid chewing on the affected side.",
            "Maintain oral hygiene."
        ],
        urgency: "Low"
    },
    {
        specialization: "Dermatologist",
        keywords: [
            "skin", "hair", "nails",
            "rashes", "itching", "acne", "hair loss", "pigmentation", "dryness", "scaling",
            "eczema", "psoriasis", "fungal infections", "dermatitis", "alopecia", "vitiligo", "skin cancer"
        ],
        precautions: [
            "Keep the affected area clean and dry.",
            "Avoid scratching or irritating the skin.",
            "Use hypoallergenic moisturizers if needed."
        ],
        urgency: "Low"
    },
    {
        specialization: "ENT Specialist",
        keywords: [
            "ear", "nose", "throat",
            "ear pain", "hearing loss", "sore throat", "nasal blockage", "sinus pain", "snoring", "loss of smell",
            "tonsillitis", "sinusitis", "ear infections", "deviated septum", "tinnitus", "vertigo"
        ],
        precautions: [
            "Avoid exposure to cold air or allergens.",
            "Steam inhalation may help with congestion.",
            "Do not insert objects into the ear."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Endocrinologist",
        keywords: [
            "hormone glands", "thyroid", "pancreas", "pituitary", "adrenal",
            "weight changes", "fatigue", "menstrual issues", "growth problems", "hair loss",
            "diabetes", "thyroid disorders", "pcos", "growth disorders", "adrenal disorders"
        ],
        precautions: [
            "Maintain a balanced diet and regular exercise.",
            "Monitor blood sugar levels if diabetic.",
            "Follow prescribed medication schedules."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Gastroenterologist",
        keywords: [
            "stomach", "intestines", "liver", "pancreas", "digestive system",
            "stomach pain", "stomach ache", "belly pain", "abdominal pain", "gastric pain", "vomiting", "diarrhea", "constipation", "acidity", "blood in stool", "digestion",
            "gastritis", "ulcer", "ibs", "liver disease", "pancreatitis", "hepatitis", "gerd"
        ],
        precautions: [
            "Drink plenty of water/fluids.",
            "Avoid spicy, oily, or acidic foods.",
            "Eat smaller, frequent meals."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Gynecologist",
        keywords: [
            "female reproductive system", "uterus", "ovaries", "vagina",
            "irregular periods", "pelvic pain", "pregnancy issues", "discharge", "infertility",
            "pcos", "fibroids", "ovarian cysts", "infections", "menstrual disorders", "pregnancy care"
        ],
        precautions: [
            "Maintain personal hygiene.",
            "Track menstrual cycles.",
            "Consult a doctor for severe pain or bleeding."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Nephrologist",
        keywords: [
            "kidneys", "urinary",
            "swelling", "decreased urine", "blood in urine", "high bp", "fatigue",
            "kidney failure", "kidney stones", "nephritis", "ckd", "dialysis"
        ],
        precautions: [
            "Stay hydrated unless restricted.",
            "Monitor blood pressure.",
            "Avoid high-sodium foods."
        ],
        urgency: "High"
    },
    {
        specialization: "Neurologist",
        keywords: [
            "brain", "spinal cord", "nerves",
            "headache", "seizures", "weakness", "numbness", "memory loss", "tremors",
            "stroke", "epilepsy", "migraine", "parkinson", "neuropathy", "multiple sclerosis"
        ],
        precautions: [
            "Rest in a quiet, dark room for migraines.",
            "Avoid triggers like stress or lack of sleep.",
            "Seek immediate help for sudden severe symptoms."
        ],
        urgency: "High"
    },
    {
        specialization: "Oncologist",
        keywords: [
            "cancer", "tumor",
            "unexplained weight loss", "lumps", "bleeding", "chronic pain", "fatigue",
            "breast cancer", "lung cancer", "blood cancer", "brain tumor", "colon cancer", "prostate cancer"
        ],
        precautions: [
            "Maintain a healthy lifestyle.",
            "Regular screenings are important.",
            "Consult a specialist for any persistent lumps or changes."
        ],
        urgency: "High"
    },
    {
        specialization: "Ophthalmologist",
        keywords: [
            "eyes", "vision",
            "blurred vision", "redness", "pain", "itching", "watering", "vision loss",
            "cataract", "glaucoma", "conjunctivitis", "refractive errors", "corneal diseases"
        ],
        precautions: [
            "Avoid rubbing your eyes.",
            "Use protective eyewear if needed.",
            "Rest eyes from screens regularly."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Orthopedist",
        keywords: [
            "bones", "joints", "muscles", "ligaments", "leg", "foot",
            "joint pain", "fractures", "swelling", "stiffness", "back pain", "knee pain", "foot pain",
            "arthritis", "dislocations", "osteoporosis", "sports injuries"
        ],
        precautions: [
            "Rest the affected area (R.I.C.E method).",
            "Avoid heavy lifting.",
            "Apply ice for swelling/pain relief."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Pediatrician",
        keywords: [
            "children", "baby", "infant", "toddler",
            "fever", "cough", "growth delay", "feeding issues", "vomiting", "diarrhea",
            "childhood infections", "asthma", "nutrition disorders", "developmental disorders"
        ],
        precautions: [
            "Keep the child hydrated.",
            "Monitor temperature closely.",
            "Ensure the child gets enough rest."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Psychiatrist",
        keywords: [
            "mental health", "depression", "anxiety", "hallucinations", "mood swings", "sleep problems",
            "schizophrenia", "bipolar disorder", "adhd"
        ],
        precautions: [
            "Reach out to trusted friends or family.",
            "Practice stress-relief techniques.",
            "Seek professional help if feeling overwhelmed."
        ],
        urgency: "Medium"
    },
    {
        specialization: "Pulmonologist",
        keywords: [
            "lungs", "respiratory",
            "cough", "breathlessness", "chest tightness", "wheezing", "chronic sputum",
            "asthma", "pneumonia", "copd", "tuberculosis", "bronchitis"
        ],
        precautions: [
            "Avoid smoke and allergens.",
            "Sit upright to help breathing.",
            "Use prescribed inhalers if applicable."
        ],
        urgency: "High"
    },
    {
        specialization: "Urologist",
        keywords: [
            "urinary", "male reproductive",
            "painful urination", "frequent urination", "blood in urine", "infertility", "erection problems",
            "kidney stones", "uti", "prostate disorders", "bladder disorders"
        ],
        precautions: [
            "Drink plenty of water.",
            "Avoid holding urine for long periods.",
            "Maintain good hygiene."
        ],
        urgency: "Medium"
    }
];

// Initialize Fuse with flattened options
const flattenedMap = symptomMap.map(item => ({
    specialization: item.specialization,
    keywords: item.keywords, // Fuse searches this array
    precautions: item.precautions,
    urgency: item.urgency
}));

const fuse = new Fuse(flattenedMap, {
    keys: ['keywords', 'specialization'],
    threshold: 0.3, // Matches typos (0.0 is exact, 1.0 is anything)
    distance: 100,
    includeScore: true
});

const getRelatedSpecializations = (query) => {
    if (!query) return { found: false, results: [] };

    const results = fuse.search(query);

    if (results.length > 0) {
        // Return top match details, but also list of specs if multiple
        const bestMatch = results[0].item;
        const allSpecs = results.map(r => r.item.specialization);
        return {
            found: true,
            specializations: [...new Set(allSpecs)], // Unique specs
            precautions: bestMatch.precautions,
            urgency: bestMatch.urgency,
            primaryMatch: bestMatch.specialization
        };
    }

    return { found: false, results: [] };
};

module.exports = { getRelatedSpecializations, symptomMap };
