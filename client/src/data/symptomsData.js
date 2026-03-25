export const SYMPTOM_DB = {
    "Head & Face": ["Headache", "Dizziness", "Vision Problem / Blurred Vision", "Red Eye", "Ear Pain", "Sore Throat", "Runny Nose", "Nasal Congestion", "Facial Pain", "Mouth Pain", "Toothache"],
    "Chest & Respiration": ["Chest Pain", "Shortness of Breath", "Cough", "Wheezing", "Palpitations", "Fast Heart Rate"],
    "Abdomen & Digestion": ["Stomach Ache", "Abdominal Pain", "Nausea", "Vomiting", "Diarrhea", "Constipation", "Bloating", "Heartburn", "Indigestion"],
    "Limbs & Joints": ["Joint Pain", "Muscle Aches", "Shoulder Pain", "Knee Pain", "Back Pain", "Neck Pain", "Leg Pain", "Arm Pain", "Foot Pain", "Hand Pain", "Swelling"],
    "Skin": ["Rash", "Itching", "Hives", "Redness", "Bruising", "Lump or Swelling", "Dry Skin", "Acne", "Wound"],
    "General / Whole Body": ["Fever", "Chills", "Fatigue / Weakness", "Night Sweats", "Weight Loss", "Weight Gain", "Loss of Appetite", "Insomnia"],
    "Urinary & Reproductive": ["Painful Urination", "Frequent Urination", "Blood in Urine", "Pelvic Pain", "Menstrual Cramps", "Vaginal Discharge", "Testicular Pain"]
};

export const CONDITIONS_DB = [
    // --- HEAD & NEUROLOGICAL ---
    {
        name: "Migraine",
        subtitle: "Severe Primary Headache",
        matchLevel: 3,
        symptoms: ["Headache", "Nausea", "Sensitivity to Light", "Vision Problem / Blurred Vision", "Dizziness", "Throbbing headache", "Aura", "Vomiting", "Sensitivity to Noise"],
        overview: "A condition characterized by intense, pulsing headache pain, typically on one side of the head. Attacks are often debilitating and accompanied by sensitivity to their environment.",
        riskFactors: ["Family history (genetics)", "Age (peaks in 30s)", "Sex (3x more common in women)", "Hormonal changes", "Stress"],
        diagnosedBy: "Clinical Exam, History of Symptoms, MRT/CT (to rule out other causes)",
        treatmentOptions: [
            "Pain Relievers: OTC meds like Ibuprofen or Excedrin Migraine.",
            "Triptans: Prescription drugs to block pain pathways.",
            "Anti-nausea medications.",
            "Quiet Environment: Resting in a dark, silent room.",
            "Preventive Medications: Beta-blockers or antidepressants for chronic cases."
        ],
        facts: [
            "Migraines rank as the third most common illness globally.",
            "Untreated episodes can persist for up to three days.",
            "Visual disturbances, known as 'aura', may signal an oncoming attack."
        ],
        commonality: "Very Common (More than 3 million cases per year in US)"
    },
    {
        name: "Tension Headache",
        subtitle: "Stress Headache",
        matchLevel: 3,
        symptoms: ["Headache", "Neck Pain", "Fatigue", "Muscle Aches", "Tightness in throat", "Sensitivity to Noise"],
        overview: "The most common form of headache, often described as a constant pressure or 'tight band' squeezing the head. It is typically mild to moderate in intensity.",
        riskFactors: ["Stress", "Poor posture", "Anxiety", "Eye strain", "Fatigue"],
        diagnosedBy: "Clinical Exam, Symptom History",
        treatmentOptions: [
            "OTC Pain Relievers: Aspirin, Ibuprofen (Advil), or Acetaminophen (Tylenol).",
            "Stress Management: Meditation, relaxation techniques.",
            "Heat/Ice Packs: Applied to soreness in neck or shoulders.",
            "Massage: To loosen tight neck muscles."
        ],
        facts: [
            "These account for the vast majority of all headaches.",
            "Unlike migraines, they rarely cause vomiting or light sensitivity.",
            "Symptoms can briefly last 30 minutes or linger for days."
        ],
        commonality: "Very Common"
    },
    {
        name: "Concussion",
        subtitle: "Mild Traumatic Brain Injury",
        matchLevel: 3,
        symptoms: ["Headache", "Confusion", "Dizziness", "Nausea", "Memory Loss", "Fainting", "Loss of Consciousness", "Ringing in Ears (Tinnitus)", "Slurred Speech"],
        overview: "A brain injury resulting from a violent blow or jolt to the head. It temporarily alters brain function and requires immediate rest.",
        riskFactors: ["Falls (especially in elderly)", "Contact Sports", "Car accidents", "Physical abuse"],
        diagnosedBy: "Neurological Exam, Cognitive Testing, CT Scan (to check for bleeding)",
        treatmentOptions: [
            "Physical Rest: Avoiding sports and strenuous activities.",
            "Mental Rest: Limiting video games, TV, and reading.",
            "Pain Relief: Acetaminophen (Tylenol). Avoid Ibuprofen initially (bleeding risk).",
            "Slow Return to Activity: Gradual increase in daily tasks."
        ],
        facts: [
            "Loss of consciousness occurs in less than 10% of concussions.",
            "Symptoms might not manifest immediately after the injury.",
            "Multiple concussions increase the risk of long-term neurological issues."
        ],
        commonality: "Common"
    },

    // --- RESPIRATORY & ENT ---
    {
        name: "Common Cold",
        subtitle: "Viral Rhinitis",
        matchLevel: 3,
        symptoms: ["Runny Nose", "Sneezing", "Sore Throat", "Cough", "Mild Fever", "Fatigue / Weakness", "Watery Eyes", "Stuffy Nose / Congestion"],
        overview: "A harmless but annoying viral infection affecting the nose and throat. It is the topmost reason for doctor visits and missed workdays.",
        riskFactors: ["Age (Children < 6)", "Weakened immune system", "Winter/Fall season", "Smoking"],
        diagnosedBy: "Self-diagnosed based on symptoms",
        treatmentOptions: [
            "Rest and Hydration: Drink plenty of water, juice, or broth.",
            "Soothe Throat: Saltwater gargle or lozenges.",
            "OTC Medications: Decongestants (Sudafed), Pain relievers.",
            "Humidifier: Adds moisture to the air to ease congestion."
        ],
        facts: [
            "The average adult contracts 2-3 colds annually.",
            "Antibiotics are ineffective as colds are viral, not bacterial.",
            "Frequent hand washing effectively reduces transmission risk."
        ],
        commonality: "Extremely Common"
    },
    {
        name: "Flu (Influenza)",
        subtitle: "Viral Respiratory Infection",
        matchLevel: 3,
        symptoms: ["Fever", "Chills", "Muscle Aches", "Cough", "Sore Throat", "Fatigue / Weakness", "Headache", "Sweating"],
        overview: "A contagious respiratory illness caused by influenza viruses that infect the nose, throat, and lungs. It strikes suddenly and is significantly more severe than a cold.",
        riskFactors: ["Age (< 5 or > 65)", "Pregnancy", "Chronic illness (Asthma, Diabetes)", "Obesity"],
        diagnosedBy: "Rapid Influenza Diagnostic Tests (RIDTs), PCR tests",
        treatmentOptions: [
            "Antiviral Drugs: Oseltamivir (Tamiflu) if taken early (within 48 hours).",
            "Bed Rest: Essential for recovery.",
            "Fluids: Prevent dehydration from fever.",
            "Pain Relievers: Acetaminophen or Ibuprofen for aches and fever."
        ],
        facts: [
            "Influenza results in thousands of US hospitalizations every year.",
            "Spread occurs mainly via airborne droplets from coughs or sneezes.",
            "Vaccination remains the most effective defense."
        ],
        commonality: "Very Common"
    },
    {
        name: "Sinusitis",
        subtitle: "Sinus Infection",
        matchLevel: 2,
        symptoms: ["Sinus Pressure", "Stuffy Nose / Congestion", "Headache", "Runny Nose", "Loss of Smell", "Fever", "Facial Pain", "Thick Discolored Mucus"],
        overview: "Inflammation of the air-filled cavities (sinuses) around the nose. When blockage prevents drainage, infection can occur.",
        riskFactors: ["Hay fever", "Nasal polyps", "Deviated septum", "Cystic fibrosis"],
        diagnosedBy: "Nasal Endoscopy, Imaging (CT/MRI), Allergy testing",
        treatmentOptions: [
            "Saline Nasal Rinse: Clears out thick mucus.",
            "Nasal Corticosteroids: Sprays to prevent inflammation.",
            "Decongestants: Short-term use for relief.",
            "Antibiotics: Only if the infection is bacterial and persistent."
        ],
        facts: [
            "Acute cases typically resolve within a month.",
            "Chronic conditions may persist for over 12 weeks.",
            "Discolored mucus often signals the presence of infection."
        ],
        commonality: "Very Common"
    },
    {
        name: "Strep Throat",
        subtitle: "Bacterial Pharyngitis",
        matchLevel: 3,
        symptoms: ["Sore Throat", "Fever", "Swollen Glands", "Difficulty Swallowing", "Headache", "Red Tonsils", "White Patches"],
        overview: "A bacterial infection that causes throat pain and inflammation. Unlike a cold, it often comes without a cough but with swollen lymph nodes.",
        riskFactors: ["Young age (5-15)", "crowded settings (schools)", "Winter/Spring"],
        diagnosedBy: "Rapid Antigen Test (Throat Swab), Throat Culture",
        treatmentOptions: [
            "Antibiotics: Penicillin or Amoxicillin are standard.",
            "Hydration: Cool liquids soothe the throat.",
            "Pain Relievers: Ibuprofen or Acetaminophen.",
            "Avoid Irritants: Cigarette smoke and fumes."
        ],
        facts: [
            "Left untreated, it causes complications like rheumatic fever.",
            "Patients typically stop being contagious 24 hours after starting antibiotics.",
            "Viral infections often cause sore throats, but Strep is bacterial."
        ],
        commonality: "Common"
    },
    {
        name: "COVID-19",
        subtitle: "SARS-CoV-2 Infection",
        matchLevel: 3,
        symptoms: ["Fever", "Cough", "Loss of Smell", "Shortness of Breath", "Fatigue / Weakness", "Muscle Aches", "Chills", "Sore Throat"],
        overview: "A respiratory illness caused by the SARS-CoV-2 coronavirus. Effects vary widely, from asymptomatic carrying to severe respiratory distress.",
        riskFactors: ["Unvaccinated status", "Older age", "Underlying medical conditions", "Immunocompromised"],
        diagnosedBy: "PCR Test (molecular), Antigen Test (rapid home test)",
        treatmentOptions: [
            "Antivirals: Paxlovid or Molnupiravir for high-risk patients.",
            "Monoclonal Antibodies: IV treatment.",
            "Supportive Care: Rest, fluids, and fever reducers.",
            "Hospitalization: Oxygen support or ventilation for severe cases."
        ],
        facts: [
            "Anosmia (loss of taste/smell) is a hallmark symptom.",
            "'Long COVID' describes symptoms persisting weeks after initial recovery.",
            "It has a higher transmission rate than seasonal influenza."
        ],
        commonality: "Very Common"
    },

    // --- DIGESTIVE ---
    {
        name: "Gastroenteritis",
        subtitle: "Stomach Flu",
        matchLevel: 3,
        symptoms: ["Nausea", "Vomiting", "Diarrhea", "Stomach Ache", "Fever", "Abdominal Cramps", "Watery Diarrhea"],
        overview: "An inflammation of the stomach and intestines caused by viruses, bacteria, or parasites. Despite the nickname 'stomach flu', it is unrelated to influenza.",
        riskFactors: ["Eating contaminated food (shellfish)", "Drinking contaminated water", "Contact with infected person (Norovirus)"],
        diagnosedBy: "Stool sample test (to rule out bacteria/parasites)",
        treatmentOptions: [
            "Hydration: Oral Rehydration Salts (Pedialyte) or sports drinks.",
            "Diet: Bland BRAT diet (Bananas, Rice, Applesauce, Toast).",
            "Rest: Letting the stomach settle.",
            "Avoid: Dairy, caffeine, and spicy foods."
        ],
        facts: [
            "Antibiotics do not clear viral cases.",
            "Norovirus is a leading cause in adults.",
            "Rapid dehydration is the primary danger for young children."
        ],
        commonality: "Very Common"
    },
    {
        name: "GERD",
        subtitle: "Chronic Acid Reflux",
        matchLevel: 3,
        symptoms: ["Heartburn", "Chest Pain", "Difficulty Swallowing", "Cough", "Hoarseness", "Regurgitation", "Sensation of lump in throat"],
        overview: "A digestive disorder where stomach acid chronically flows back into the esophagus. This constant backwash irritates the esophageal lining.",
        riskFactors: ["Obesity", "Pregnancy", "Hiatal hernia", "Smoking", "Eating large meals late at night"],
        diagnosedBy: "Upper Endoscopy, Ambulatory acid (pH) probe test, X-ray",
        treatmentOptions: [
            "Antacids: Tums or Mylanta for quick relief.",
            "H2 Blockers: Pepcid AC to reduce acid production.",
            "Proton Pump Inhibitors (PPIs): Prilosec or Nexium for stronger blocking.",
            "Surgery: Fundoplication to reinforce the lower esophageal sphincter."
        ],
        facts: [
            "Uncontrolled reflux can erode tooth enamel.",
            "Long-term cases may lead to Barrett's esophagus, a cancer risk.",
            "Sleeping with an elevated head position helps prevent night-time symptoms."
        ],
        commonality: "Very Common"
    },
    {
        name: "Irritable Bowel Syndrome (IBS)",
        subtitle: "Spastic Colon",
        matchLevel: 2,
        symptoms: ["Stomach Ache", "Bloating", "Gas", "Diarrhea", "Constipation", "Abdominal Cramps", "Mucus in stool"],
        overview: "A chronic condition affecting the large intestine, characterized by cramping, bloating, and irregular bowel habits without permanent damage to the colon.",
        riskFactors: ["Young age (< 50)", "Female sex", "Family history", "Anxiety/Depression", "Severe gut infection"],
        diagnosedBy: "Exclusion (ruling out other diseases), Rome criteria, Colonoscopy",
        treatmentOptions: [
            "Dietary Changes: Low FODMAP diet, high fiber.",
            "Medications: Antispasmodics (Bentyl), Laxatives (for constipation), Anti-diarrheals (Imodium).",
            "Probiotics: To restore gut bacteria balance.",
            "Mental Health Therapies: Cognitive behavioral therapy (gut-brain axis)."
        ],
        facts: [
            "It does not increase the risk of colorectal cancer.",
            "The exact cause is unknown but involves the gut-brain interaction.",
            "Stress often triggers or worsens episodes."
        ],
        commonality: "Very Common"
    },

    // --- MUSCULOSKELETAL ---
    {
        name: "Cervical Spondylosis",
        subtitle: "Neck Arthritis",
        matchLevel: 3,
        symptoms: ["Neck Pain", "Stiffness", "Headache", "Grinding Sensation", "Shoulder Pain", "Tingling Arms"],
        overview: "A term for age-related wear affecting the spinal disks in the neck. As disks dehydrate, osteoarthritis signs like bone spurs often develop.",
        riskFactors: ["Age (older than 60)", "Occupation (neck strain)", "Neck injuries", "Genetic factors", "Smoking"],
        diagnosedBy: "Physical exam, Neck X-ray, MRI, CT Myelography, Nerve function tests (EMG)",
        treatmentOptions: [
            "Physical Therapy: Exercises to stretch and strengthen neck muscles.",
            "Medications: NSAIDs (Ibuprofen), Muscle relaxants, Corticosteroids.",
            "Ice & Heat: applying heat or ice to the neck can relive sore muscles.",
            "Soft Collar: A soft padded brace to support the neck for short periods.",
            "Surgery: Reserved for severe cases (e.g., bone / disk removal)."
        ],
        facts: [
            "Prevalent in nearly 90% of individuals over age 60.",
            "The cervical spine is the most mobile section of the backbone.",
            "Sudden forces like whiplash are major injury causes."
        ],
        commonality: "Very Common"
    },
    {
        name: "Sciatica",
        subtitle: "Sciatic Nerve Pain",
        matchLevel: 3,
        symptoms: ["Back Pain (Lower)", "Pain Radiating to Leg", "Numbness", "Tingling", "Weakness", "Hip Pain", "Burning sensation"],
        overview: "Pain originating in the lower back and traveling down the sciatic nerve into the leg. It typically affects only one side of the body.",
        riskFactors: ["Age (30-50)", "Obesity", "Prolonged sitting", "Diabetes", "Heavy lifting"],
        diagnosedBy: "Physical exam, Straight leg raise test, X-ray, MRI, CT scan, EMG",
        treatmentOptions: [
            "Self-Care: Cold packs initially, then hot packs; stretching exercises.",
            "Medications: Anti-inflammatories, Muscle relaxants, Biofreeze.",
            "Physical Therapy: To correct posture and strengthen back muscles.",
            "Steroid Injections: Corticosteroid medication injected into the painful area.",
            "Surgery: Laminectomy or Microdiscectomy if nerve weakness persists."
        ],
        facts: [
            "The sciatic nerve is the largest single nerve in the body.",
            "Surgical intervention is rarely needed for full recovery.",
            "Sensations range from mild aches to sharp burning pains."
        ],
        commonality: "Common (40% of people)"
    },
    {
        name: "Plantar Fasciitis",
        subtitle: "Heel Pain Syndrome",
        matchLevel: 3,
        symptoms: ["Heel Pain", "Foot Pain", "Stiffness", "Swelling", "Pain after sleeping"],
        overview: "Inflammation of the fibrous tissue along the bottom of the foot connecting the heel to the toes. Pain is often sharpest with the first morning steps.",
        riskFactors: ["Age (40-60)", "Certain exercises (running/ballet)", "Foot mechanics (flat feet)", "Obesity", "Occupations on feet"],
        diagnosedBy: "Physical exam (checking for tender areas), X-ray or MRI to rule out fractures",
        treatmentOptions: [
            "Stretching: Calves and plantar fascia stretches.",
            "Orthotics: Arch supports or heel cups.",
            "Night Splints: Holds the foot in a lengthened position overnight.",
            "Physical Therapy",
            "Icing the area",
            "Medication: NSAIDs (Ibuprofen)"
        ],
        facts: [
            "Morning pain upon waking is a classic symptom.",
            "It is a top complaint among runners.",
            "Neglecting symptoms can lead to chronic issues altering your walk."
        ],
        commonality: "Very Common"
    },
    {
        name: "Carpal Tunnel Syndrome",
        subtitle: "Median Nerve Compression",
        matchLevel: 3,
        symptoms: ["Hand Numbness", "Finger Tingling", "Weakness", "Wrist Pain", "Dropping objects"],
        overview: "A condition caused by compression of the median nerve as it travels through the wrist. It leads to numbness, tingling, and weakness in the hand.",
        riskFactors: ["Anatomy (small tunnel)", "Sex (Women)", "Obesity", "Workplace factors (vibrating tools)", "Diabetes"],
        diagnosedBy: "Tinel's sign test, Phalen's sign test, X-ray, Electromyography",
        treatmentOptions: [
            "Wrist Splinting: Especially at night to keep wrist straight.",
            "NSAIDs: Ibuprofen to relieve pain.",
            "Corticosteroids: Injections into the carpal tunnel.",
            "Surgery: Carpal tunnel release involves cutting the ligament pressing on the nerve."
        ],
        facts: [
            "The median nerve does not impact the pinky finger.",
            "One of the most frequently diagnosed nerve disorders.",
            "Fluid retention during pregnancy can be a temporary cause."
        ],
        commonality: "Common"
    },
    {
        name: "Osteoarthritis",
        subtitle: "Degenerative Joint Disease",
        matchLevel: 2,
        symptoms: ["Joint Pain", "Stiffness", "Swelling", "Grinding Sensation", "Reduced Mobility", "Bone Spurs"],
        overview: "The most prevalent arthritis type, involving the gradual wearing down of protective cartilage at the ends of bones.",
        riskFactors: ["Older age", "Sex (Women)", "Obesity", "Joint injuries", "Genetics"],
        diagnosedBy: "Joint Aspiration, X-rays (shows bone spurs/space narrowing), MRI",
        treatmentOptions: [
            "Medications: Acetaminophen, NSAIDs, Duloxetine.",
            "Therapy: Physical therapy, Occupational therapy.",
            "Injections: Cortisone or Lubrication injections.",
            "Surgery: Joint replacement (Hip/Knee)."
        ],
        facts: [
            "Commonly targets the hands, knees, hips, and spine.",
            "Physical activity helps maintain muscle support for joints.",
            "Small amounts of weight loss can drastically reduce knee strain."
        ],
        commonality: "Very Common"
    },

    // --- CARDIAC ---
    {
        name: "Angina",
        subtitle: "Ischemic Chest Pain",
        matchLevel: 3,
        symptoms: ["Chest Pain", "Shortness of Breath", "Nausea", "Fatigue / Weakness", "Dizziness", "Sweating", "Pressure in chest"],
        overview: "Chest discomfort arising when heart muscles don't receive sufficient oxygen-rich blood. It is a warning symptom of coronary artery disease, not a disease itself.",
        riskFactors: ["Tobacco use", "Diabetes", "High blood pressure", "High cholesterol", "Lack of exercise"],
        diagnosedBy: "ECG (Electrocardiogram), Stress test, Echocardiogram, Coronary Angiography",
        treatmentOptions: [
            "Lifestyle Changes: Quit smoking, weight loss.",
            "Medications: Nitrates (Nitroglycerin), Aspirin, Beta-blockers, Statins.",
            "Angioplasty and Stenting: Unblocking arteries.",
            "CABG Surgery: Bypass surgery for blocked arteries."
        ],
        facts: [
            "Stable angina is predictable and triggered by stress or exertion.",
            "Unstable angina strikes unexpectedly and signals a potential heart attack.",
            "Symptoms in women often manifest as nausea or extreme fatigue rather than pain."
        ],
        commonality: "Common"
    },
    {
        name: "Panic Attack",
        subtitle: "Anxiety Episode",
        matchLevel: 2,
        symptoms: ["Palpitations / Racing Heart", "Shortness of Breath", "Sweating", "Tremors", "Chest Pain", "Dizziness", "Numbness", "Sense of doom"],
        overview: "A sudden surge of overwhelming fear that triggers intense physical reactions despite the lack of immediate danger. The experience can be terrifying and feel life-threatening.",
        riskFactors: ["Family history", "Major life stress", "Traumatic events", "Smoke/Caffeine excess"],
        diagnosedBy: "Psychological evaluation, Physical exam (to rule out heart issues)",
        treatmentOptions: [
            "Psychotherapy: Cognitive behavioral therapy (CBT).",
            "Medications: SSRIs (antidepressants), Benzodiazepines (short term).",
            "Breathing Techniques: Deep breathing to slow heart rate.",
            "Mindfulness: Grounding techniques."
        ],
        facts: [
            "Symptoms frequently mirror those of a cardiac arrest.",
            "Episodes usually reach peak intensity within 10 minutes.",
            "Specific phobias are a common trigger for these attacks."
        ],
        commonality: "Common"
    },

    // --- OTHER ---
    {
        name: "Anemia",
        subtitle: "Low Hemoglobin/Iron",
        matchLevel: 2,
        symptoms: ["Fatigue / Weakness", "Pale Skin", "Shortness of Breath", "Dizziness", "Cold Hands", "Cold Feet", "Irregular heartbeats"],
        overview: "A deficiency in healthy red blood cells required to transport adequate oxygen throughout the body. There are multiple types, each stemming from different causes.",
        riskFactors: ["Diet lacking certain vitamins (Iron/B12)", "Intestinal disorders", "Menstruation", "Pregnancy", "Chronic conditions"],
        diagnosedBy: "CBC Blood Test (Complete Blood Count)",
        treatmentOptions: [
            "Supplements: Iron, Vitamin B12, Folic acid.",
            "Dietary Changes: Eating iron-rich foods (spinach, red meat).",
            "Treat Underlying Cause: If due to bleeding or bone marrow issues.",
            "Blood Transfusion: For severe cases."
        ],
        facts: [
            "Iron deficiency is the leading cause globally.",
            "Unexplained tiredness is the most frequent complaint.",
            "Hemoglobin is the iron-rich protein that enables oxygen transport."
        ],
        commonality: "Common"
    },
    {
        name: "Dehydration",
        subtitle: "Fluid Deficit",
        matchLevel: 2,
        symptoms: ["Excessive Thirst", "Dry Mouth", "Fatigue / Weakness", "Dizziness", "Dark Urine", "Headache", "Dry Skin"],
        overview: "A state where the body loses more fluids than it intakes, disrupting normal metabolic functions. It is not just about feeling thirsty but a physiological imbalance.",
        riskFactors: ["Infants/Children", "Older adults", "Chronic illness", "Working outside in heat"],
        diagnosedBy: "Urinalysis, Blood tests (Electrolytes)",
        treatmentOptions: [
            "Rehydration: Drinking water or sports drinks with electrolytes.",
            "Oral Rehydration Salts: Specific solutions for severe cases.",
            "IV Fluids: For severe dehydration in a hospital setting.",
            "Cooling: If caused by heatstroke."
        ],
        facts: [
            "Thirst is often a late sign; you may already be dehydrated.",
            "Fluid loss occurs rapidly even in cold climates.",
            "Prolonged cases can result in serious kidney damage."
        ],
        commonality: "Very Common"
    },
    {
        name: "Urinary Tract Infection",
        subtitle: "Bladder Infection (Cystitis)",
        matchLevel: 3,
        symptoms: ["Frequent Urination", "Painful Urination", "Pelvic Pain", "Cloudy Urine", "Blood in Urine", "Strong smelling urine"],
        overview: "An infection targeting any part of the urinary system, though typically affecting the bladder and urethra. It is caused by bacteria entering the urinary tract.",
        riskFactors: ["Female anatomy", "Sexual activity", "Menopause", "Birth control (spermicides)"],
        diagnosedBy: "Urinalysis, Urine Culture",
        treatmentOptions: [
            "Antibiotics: Trimethoprim/sulfamethoxazole (Bactrim), Fosfomycin, Nitrofurantoin.",
            "Pain Relievers: Phenazopyridine (AZO) to numb the bladder.",
            "Hydration: Drinking lots of water to flush bacteria."
        ],
        facts: [
            "Women are significantly more prone to UTIs than men.",
            "Cranberry products are better for prevention than cure.",
            "Flank pain may signal that the infection has reached the kidneys."
        ],
        commonality: "Very Common"
    },

    // --- SKIN ---
    {
        name: "Eczema",
        subtitle: "Atopic Dermatitis",
        matchLevel: 3,
        symptoms: ["Itching", "Dry skin", "Red rash in one area", "Flaking of skin in one area", "Crusty bump(s)", "Rough skin", "Sensitive skin"],
        overview: "A chronic condition making skin red and itchy. While frequent in children, it can manifest at any age and tends to flare up periodically.",
        riskFactors: ["Personal/Family history of eczema, allergies, hay fever or asthma."],
        diagnosedBy: "Physical Exam, Patch testing (for allergies)",
        treatmentOptions: [
            "Moisturize: Apply creams/ointments at least twice a day.",
            "Corticosteroid Creams: Prescription strength anti-inflammatories.",
            "Calcineurin Inhibitors: Tacrolimus or Pimecrolimus.",
            "Biologics: Dupixent (injectable) for severe cases.",
            "Wet Dressings: Covering lesions with wet bandages."
        ],
        facts: [
            "Often dubbed 'the itch that rashes' because scratching fuels the rash.",
            "It is strictly non-contagious.",
            "Over 30 million Americans manage some form of this condition."
        ],
        commonality: "Very Common"
    },
    {
        name: "Psoriasis",
        subtitle: "Plaque Psoriasis",
        matchLevel: 3,
        symptoms: ["Flaky raised skin patch(es) in one area", "Itching", "Dry cracked skin", "Thick scar tissue", "Small pits on nail", "Silver scales"],
        overview: "An autoimmune disease accelerating skin cell life cycles, leading to itchy, scaly patches. It is a long-term condition for which there is currently no cure.",
        riskFactors: ["Family history", "Stress", "Smoking", "Obesity"],
        diagnosedBy: "Physical Exam, Skin Biopsy (rarely needed)",
        treatmentOptions: [
            "Topical Corticosteroids: Mainstay of treatment.",
            "Vitamin D Analogues: Slow skin cell growth.",
            "Phototherapy: Exposure to UV light.",
            "Biologics: Humira, Cosentyx, Skyrizi (target immune system)."
        ],
        facts: [
            "It causes skin cells to multiply up to 10 times faster than normal.",
            "Linked to comorbidities like diabetes and cardiovascular issues.",
            "About 30% of patients also develop psoriatic arthritis."
        ],
        commonality: "Common"
    },
    {
        name: "Acne",
        subtitle: "Acne Vulgaris",
        matchLevel: 3,
        symptoms: ["Acne-like rash", "Whitehead(s) and Blackhead(s) in one area", "Pus-filled bump(s) in one area", "Oily skin", "Red inflamed pus-filled bump(s) all over"],
        overview: "A common skin disorder where hair follicles become clogged with oil and dead cells. It results in various blemishes, from blackheads to cysts.",
        riskFactors: ["Hormonal changes (puberty)", "Medications (Steroids)", "Stress", "Diet (High sugar/carb)"],
        diagnosedBy: "Visual Exam by Dermatologist",
        treatmentOptions: [
            "Topical Retinoids: Tretinoin, Adapalene.",
            "Antibiotics: Minocycline or Doxycycline (oral) or Clindamycin (topical).",
            "Salicylic Acid & Benzoyl Peroxide: Common OTC cleansers.",
            "Isotretinoin (Accutane): For severe cystic acne."
        ],
        facts: [
            "Ranked as the most prevalent skin condition in the U.S.",
            "Hygiene is not the root cause; scrubbing can worsen it.",
            "Greasy foods are rarely a direct trigger for outbreaks."
        ],
        commonality: "Extremely Common"
    },
    {
        name: "Hives",
        subtitle: "Urticaria",
        matchLevel: 3,
        symptoms: ["Hives", "Hive-like rash all over", "Itching", "Swollen raised skin patch(es)"],
        overview: "Red, itchy welts triggered by a skin reaction. They vary in size and can appear, fade, and reappear rapidly.",
        riskFactors: ["Allergies (Foods, Pet dander)", "Stress", "Infections", "Medications"],
        diagnosedBy: "Physical Exam, Allergy Skin Tests",
        treatmentOptions: [
            "Antihistamines: Diphenhydramine (Benadryl), Cetirizine (Zyrtec).",
            "Corticosteroids: Prednisone for severe swelling.",
            "Cool Compresses: To soothe itching.",
            "Loose Clothing: To prevent irritation."
        ],
        facts: [
            "These welts can emerge on any part of the body.",
            "Chronic cases differ by persisting longer than six weeks.",
            "Often, the direct cause remains unidentified (idiopathic)."
        ],
        commonality: "Very Common"
    },
    {
        name: "Rosacea",
        subtitle: "Facial Redness",
        matchLevel: 3,
        symptoms: ["Red or purplish rash on face", "Spider vein(s) limited to face", "Visible blood vessels", "Swollen nose", "Red bumps"],
        overview: "A condition causing visible redness and blood vessels in the face. It may also produce small, red, pus-filled bumps mimicking acne.",
        riskFactors: ["Female", "Light skin", "Age > 30", "Smokers"],
        diagnosedBy: "Physical Exam (differentiating from acne/lupus)",
        treatmentOptions: [
            "Trigger Avoidance: Sun, heat, alcohol, spicy foods.",
            "Topical Gels: Brimonidine (reduces redness), Metronidazole.",
            "Oral Antibiotics: Doxycycline (for bumps).",
            "Laser Therapy: To reduce visible blood vessels."
        ],
        facts: [
            "Frequently confused with acne, eczema, or skin allergies.",
            "While incurable, treatments significantly control flare-ups.",
            "Severe cases can lead to a bulbous, swollen nose (rhinophyma)."
        ],
        commonality: "Common"
    }
];

