/**
 * Drug Interaction Knowledge Graph (JSON DB)
 * A critical safety engine for the Doctor's AI Assistant.
 */

const DRUG_INTERACTIONS = {
    // NSAIDs Interactions
    "aspirin": [
        { drug: "warfarin", severity: "MAJOR", risk: "Increased bleeding risk." },
        { drug: "ibuprofen", severity: "MODERATE", risk: "Reduced cardioprotective effect." },
        { drug: "heparin", severity: "MAJOR", risk: "Hemorrhage risk." }
    ],
    "ibuprofen": [
        { drug: "aspirin", severity: "MODERATE", risk: "Reduced cardioprotective effect." },
        { drug: "lisinopril", severity: "MODERATE", risk: "Reduced antihypertensive effect." }
    ],

    // Antibiotics
    "azithromycin": [
        { drug: "warfarin", severity: "MODERATE", risk: "Increased bleeding due to enzyme inhibition." },
        { drug: "ergotamine", severity: "MAJOR", risk: "Acute ergotism (gangrene risk)." }
    ],
    "ciprofloxacin": [
        { drug: "theophylline", severity: "MAJOR", risk: "Theophylline toxicity (seizures)." },
        { drug: "antacids", severity: "MODERATE", risk: "Reduced absorption of antibiotic." }
    ],

    // Statins (Cholesterol)
    "atorvastatin": [
        { drug: "clarithromycin", severity: "MAJOR", risk: "Increased risk of myopathy/rhabdomyolysis." },
        { drug: "itraconazole", severity: "MAJOR", risk: "Significantly increased statin levels." }
    ],
    "simvastatin": [
        { drug: "amlodipine", severity: "MODERATE", risk: "Increased risk of myopathy at high doses." },
        { drug: "grapefruit juice", severity: "MODERATE", risk: "Increased drug levels." }
    ],

    // Hypertension
    "lisinopril": [
        { drug: "potassium supplements", severity: "MAJOR", risk: "Hyperkalemia (Heart arrhythmia)." },
        { drug: "spironolactone", severity: "MAJOR", risk: "Severe hyperkalemia." }
    ],
    "amlodipine": [
        { drug: "simvastatin", severity: "MODERATE", risk: "Increased risk of myopathy." }
    ],

    // Diabetes
    "metformin": [
        { drug: "contrast dye", severity: "MAJOR", risk: "Lactic acidosis (Must hold for 48h)." },
        { drug: "alcohol", severity: "MODERATE", risk: "Increased risk of lactic acidosis." }
    ],
    "insulin": [
        { drug: "beta-blockers", severity: "MODERATE", risk: "Masks symptoms of hypoglycemia." }
    ],

    // Blood Thinners
    "warfarin": [
        { drug: "aspirin", severity: "MAJOR", risk: "Bleeding risk." },
        { drug: "garlic", severity: "MINOR", risk: "Increased bleeding risk." },
        { drug: "vitamin k", severity: "MODERATE", risk: "Reduces efficacy." }
    ]
};

const checkInteraction = (drugA, drugB) => {
    drugA = drugA.toLowerCase();
    drugB = drugB.toLowerCase();

    if (DRUG_INTERACTIONS[drugA]) {
        const found = DRUG_INTERACTIONS[drugA].find(i => i.drug === drugB);
        if (found) return { drug1: drugA, drug2: drugB, ...found };
    }
    if (DRUG_INTERACTIONS[drugB]) {
        const found = DRUG_INTERACTIONS[drugB].find(i => i.drug === drugA);
        if (found) return { drug1: drugB, drug2: drugA, ...found };
    }
    return null;
};

module.exports = { DRUG_INTERACTIONS, checkInteraction };
