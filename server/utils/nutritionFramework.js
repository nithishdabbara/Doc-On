/**
 * Nutrition & Diet Planning Framework
 * Comprehensive "Food as Medicine" Rules Engine.
 * Covers 12 Clinical Domains with Reasoning.
 */

const NUTRITION_FRAMEWORK = {
    cardiology: {
        keywords: ['ldl', 'cholesterol', 'triglycerides', 'hdl', 'crp', 'blood pressure', 'hypertension', 'angina'],
        condition: 'Heart & Cholesterol Health (Cardiology)',
        reasoning: 'Reduces plaque formation and inflammation. High soluble fiber binds cholesterol.',
        diet: {
            eat: ['Oats & Barley (Beta-glucans)', 'Walnuts & Almonds (Omega-3)', 'Fatty Fish (Salmon/Mackerel)', 'Olive Oil', 'Avocados', 'Berries', 'Leafy Greens'],
            avoid: ['Trans Fats (Fried Food)', 'Red Meat (Beef/Mutton)', 'Butter & Ghee (Saturated Fat)', 'Processed Bakery Items', 'High Sodium Foods']
        },
        lifestyle: ['30 mins Brisk Walking daily', 'Stress Management (Yoga/Meditation)', 'Smoking Cessation']
    },
    endocrinology: {
        keywords: ['hba1c', 'sugar', 'glucose', 'insulin', 'diabetes', 'type 2'],
        condition: 'Diabetes & Blood Sugar Control (Endocrinology)',
        reasoning: 'Focus on Low Glycemic Index (GI) foods to prevent insulin spikes.',
        diet: {
            eat: ['Complex Carbs (Millets, Quinoa)', 'Legumes (Dal, Sprouts)', 'Fiber-rich Veg (Bitter Gourd, Spinach)', 'Whole Fruits (Papaya, Apple)', 'Fenugreek Seeds'],
            avoid: ['Simple Sugars (Sweets, Soda)', 'Refined Flour (Maida, White Bread)', 'Fried Snacks', 'Fruit Juices (High Fructose)']
        },
        lifestyle: ['Post-meal Walking (15 mins)', 'Regular Glucose Monitoring', 'Weight Reduction']
    },
    thyroid_hypo: {
        keywords: ['tsh', 't3', 't4', 'hypothyroid', 'thyroid'],
        condition: 'Hypothyroidism (Thyroid Health)',
        reasoning: 'Requires Iodine and Selenium for hormone synthesis. Goitrogens interfere with function.',
        diet: {
            eat: ['Selenium-rich Foods (Brazil Nuts, Sunflower Seeds)', 'Iodized Salt', 'Eggs (Whole)', 'Dairy (Yogurt/Milk)', 'Fish'],
            avoid: ['Raw Cruciferous Veg (Cabbage, Cauliflower, Broccoli) - Cook them well', 'Excess Soy Products', 'Gluten (if sensitive)']
        },
        lifestyle: ['Morning Sunlight (Vitamin D activation)', 'Regular Exercise to boost metabolism']
    },
    liver: {
        keywords: ['lft', 'sgot', 'sgpt', 'bilirubin', 'fatty liver', 'jaundice'],
        condition: 'Liver Health (Hepatology)',
        reasoning: 'Reduces liver work/fat accumulation. Supports regenerative capacity.',
        diet: {
            eat: ['Antioxidants (Coffee - moderation, Green Tea)', 'Cruciferous Veg', 'Garlic', 'Turmeric', 'Beetroot'],
            avoid: ['ALCOHOL (Strictly)', 'High Fructose Corn Syrup', 'Deep Fried Foods', 'Packaged Snacks']
        },
        lifestyle: ['Weight Loss (essential for Fatty Liver)', 'Hepatitis Vaccination']
    },
    kidney: {
        keywords: ['creatinine', 'urea', 'egfr', 'kidney', 'renal'],
        condition: 'Kidney Health (Nephrology)',
        reasoning: 'Limits nitrogenous waste and manages electrolyte balance (Sodium/Potassium).',
        diet: {
            eat: ['Low Potassium Veg (Bottle Gourd, Cabbage)', 'Egg Whites (Low Phosphorus)', 'Apples', 'Berries', 'Cauliflower'],
            avoid: ['High Potassium (Coconut Water, Banana, Spinach - if cooked improperly)', 'High Phosphorus (Cola, Processed Cheese)', 'Excess Salt', 'Red Meat']
        },
        lifestyle: ['Fluid intake as per doctor limit', 'Avoid NSAID painkillers']
    },
    anemia: {
        keywords: ['hemoglobin', 'cbc', 'ferritin', 'iron', 'pale'],
        condition: 'Anemia & Hemoglobin Levels',
        reasoning: 'Boosts Iron absorption (Heme vs Non-Heme) and RBC production.',
        diet: {
            eat: ['Iron-rich (Spinach, Beetroot, Dates)', 'Vitamin C Helpers (Lemon, Orange - with meals)', 'Meat/Liver (Heme Iron)', 'Pomegranate', 'Jaggery'],
            avoid: ['Tea/Coffee with meals (Tannins block absorption)', 'Calcium supplements with Iron']
        },
        lifestyle: ['Cook in Iron utensils (Cast Iron)']
    },
    vitamin_d: {
        keywords: ['vitamin d', 'calciferol', 'sun'],
        condition: 'Vitamin D Deficiency',
        reasoning: 'Crucial for Calcium absorption and immune function.',
        diet: {
            eat: ['Fortified Milk/Cereals', 'Egg Yolks', 'Mushrooms (Sun-exposed)', 'Fatty Fish'],
            avoid: []
        },
        lifestyle: ['Sunlight exposure (10am-2pm, 20 mins)', 'Supplements (Cholecalciferol) if <30 ng/mL']
    },
    vitamin_b12: {
        keywords: ['b12', 'cobalamin', 'tingling', 'numbness'],
        condition: 'Vitamin B12 Deficiency',
        reasoning: 'Essential for nerve function and DNA synthesis.',
        diet: {
            eat: ['Animal Products (Meat, Eggs, Milk)', 'Fortified Nutritional Yeast (Vegan)', 'Cheese'],
            avoid: ['Alcohol (impairs absorption)']
        },
        lifestyle: ['Consider Methylcobalamin supplements if vegetarian']
    },
    obesity: {
        keywords: ['bmi', 'obesity', 'overweight', 'weight loss'],
        condition: 'Obesity & Weight Management',
        reasoning: 'Calorie deficit with nutrient density to maintain metabolism.',
        diet: {
            eat: ['High Protein (prevents muscle loss)', 'Fiber (Satiety)', 'Water-rich Veg (Cucumber, Melon)'],
            avoid: ['Empty Calories (Soda, Candy)', 'Ultra-processed foods', 'Liquid calories']
        },
        lifestyle: ['Strength Training', '8 hours Sleep (Hormonal balance)', 'Intermittent Fasting (if verified)']
    },
    stomach: {
        keywords: ['ibs', 'gastric', 'gerd', 'acidity', 'bloating', 'h. pylori', 'stomach'],
        condition: 'Gut Health (Gastroenterology/IBS)',
        reasoning: 'Reduces inflammation and balances gut microbiome.',
        diet: {
            eat: ['Probiotics (Curd/Yogurt)', 'Prebiotics (Banana, Oats)', 'Ginger (Anti-nausea)', 'Lightly cooked meals (Khichdi)'],
            avoid: ['Spicy/Oily Masalas', 'Caffeine', 'Carbonated Drinks', 'Raw salads (if weak digestion)', 'Dairy (if lactose intolerant)']
        },
        lifestyle: ['Small frequent meals', 'No lying down immediately after eating']
    },
    pcos: {
        keywords: ['pcos', 'pcod', 'hormonal', 'periods', 'ovary', 'acne', 'hirsutism'],
        condition: 'PCOS & Hormonal Balance',
        reasoning: 'Targets Insulin Resistance which drives high androgens.',
        diet: {
            eat: ['Low Glycemic Index Foods', 'Cinnamon', 'Flax Seeds', 'Spearmint Tea (Anti-androgen)', 'Protein-rich breakfast'],
            avoid: ['Refined Sugar', 'Dairy (if acne prone)', 'High Carb snacks']
        },
        lifestyle: ['Weight training', 'Stress Reduction (Cortisol management)']
    },
    bone: {
        keywords: ['bone', 'calcium', 'osteoporosis', 'joint', 'fracture', 'orthopedic'],
        condition: 'Bone & Joint Health (Orthopedics)',
        reasoning: 'Provides building blocks (Calcium/Collagen) and absorption factors.',
        diet: {
            eat: ['Dairy (Milk, Paneer)', 'Ragi (Finger Millet - High Calcium)', 'Sesame Seeds', 'Leafy Greens', 'Bone Broth'],
            avoid: ['Excess Salt (leaches Calcium)', 'Excess Caffeine', 'Cola (Phosphoric acid)']
        },
        lifestyle: ['Weight-bearing exercises', 'Fall prevention']
    }
};

module.exports = NUTRITION_FRAMEWORK;
