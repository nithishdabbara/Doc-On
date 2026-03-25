import React from 'react';

// 1. Cute Tooth Icon
export const ToothIcon = ({ size = 24, color = 'currentColor', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path
            d="M7 4c-2 0-4 3-4 5 0 2.5 1 5 3 8 0 2 2 4 4 4s2-1 2-3c0 2 2 3 2 3s2 1 4-4c2-3 3-5.5 3-8 0-2-2-5-4-5-1 0-3 1-4 2-1-1-3-2-4-2z"
            fill="#FEF3C7"
            stroke="#000"
            strokeWidth="2"
        />
        <path d="M9 13a2 2 0 0 1 2 2" stroke="#000" strokeWidth="2" />
        <circle cx="9" cy="11" r="1.5" fill="#000" />
        <circle cx="15" cy="11" r="1.5" fill="#000" />
        <path d="M12 15c0 1.5-1 2-2 2" stroke="none" />
        <path d="M10 14q2 2 4 0" stroke="#000" strokeWidth="1.5" fill="none" />
        <circle cx="7.5" cy="13.5" r="1.5" fill="#F472B6" stroke="none" opacity="0.6" />
        <circle cx="16.5" cy="13.5" r="1.5" fill="#F472B6" stroke="none" opacity="0.6" />
        <path d="M19 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#7DD3FC" stroke="none" />
        <path d="M4 18l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" fill="#7DD3FC" stroke="none" />
    </svg>
);

// 2. Dermatologist Icon
export const DermatologistIcon = ({ size = 24, color = 'currentColor', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12 2a10 10 0 0 0-7 10c0 5 3 8 7 8 2 0 4-2 4-2" stroke="#000" strokeWidth="2" fill="#FFEDD5" />
        <path d="M4 10c0-4 3-7 8-7s8 2 8 6" stroke="#4B5563" strokeWidth="2" />
        <path d="M9 10h2" stroke="#000" />
        <path d="M13 10h2" stroke="#000" />
        <circle cx="15" cy="15" r="5" fill="#FED7AA" stroke="#4B5563" strokeWidth="2" opacity="0.9" />
        <path d="M18.5 18.5L22 22" stroke="#000" strokeWidth="3" />
        <path d="M13.5 14l1 1" stroke="#EF4444" strokeWidth="1" />
        <path d="M16 13.5l-1 1" stroke="#EF4444" strokeWidth="1" />
        <circle cx="15" cy="16" r="0.5" fill="#EF4444" />
    </svg>
);

// 3. Stomach Icon
export const StomachIcon = ({ size = 24, color = 'currentColor', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path
            d="M7 4V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5c0 1.5.5 2.5 1.5 3.5 2.5 2.5 5 1.5 6.5 3 .5.5 1 1.5 1 3a5.5 5.5 0 0 1-5.5 5.5H12c-3 0-5.5-2-6-5-.5-3 0-5 1-7"
            fill="#FF99AA"
            stroke="#BE185D"
            strokeOpacity="0.8"
        />
        <path
            d="M7 11.5c1 1 2 0 3 1s2 1 3 0 2 0 3 1v.5a5.5 5.5 0 0 1-5.5 5.5H12c-2.5 0-4.5-1.5-5.5-3.5"
            fill="#FCD34D"
            stroke="none"
        />
        <path d="M6 17c-1.5 1-2.5 2.5-2.5 4v1h3v-1" stroke="#BE185D" fill="none" />
        <circle cx="10" cy="15" r="1" fill="#FEF3C7" />
        <circle cx="13" cy="16" r="1.5" fill="#FEF3C7" />
        <circle cx="11" cy="18" r="0.5" fill="#FEF3C7" />
    </svg>
);

// 4. Kidneys Icon (Nephrologist)
export const KidneysIcon = ({ size = 24, color = 'currentColor', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {/* Left Kidney */}
        <path
            d="M8.5 7c-2.5 0-4.5 3-4.5 6s2 6 4.5 6c1.5 0 2.5-1 2.5-3v-6c0-2-1-3-2.5-3z"
            fill="#BAE6FD"
            stroke="#0EA5E9"
            strokeWidth="2"
        />
        {/* Right Kidney */}
        <path
            d="M15.5 7c2.5 0 4.5 3 4.5 6s-2 6-4.5 6c-1.5 0-2.5-1-2.5-3v-6c0-2 1-3 2.5-3z"
            fill="#BAE6FD"
            stroke="#0EA5E9"
            strokeWidth="2"
        />
        {/* Connections (Ureters/Arteries) */}
        <path d="M11 16v6" stroke="#0EA5E9" strokeWidth="2" />
        <path d="M13 16v6" stroke="#0EA5E9" strokeWidth="2" />
        <path d="M11 13c-1-1-2-1-2.5 1" stroke="#0EA5E9" />
        <path d="M13 13c1-1 2-1 2.5 1" stroke="#0EA5E9" />

        {/* Shiny highlights */}
        <path d="M6 10a4 4 0 0 1 2-2" stroke="white" strokeWidth="2" opacity="0.6" />
        <path d="M18 10a4 4 0 0 0-2-2" stroke="white" strokeWidth="2" opacity="0.6" />
    </svg>
);

// 5. Cancer Awareness Ribbon (Oncologist)
export const CancerRibbonIcon = ({ size = 24, color = 'currentColor', ...props }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path
            d="M12 4c-3 0-5 2-5 5 0 4 3 7 5 11 2-4 5-7 5-11 0-3-2-5-5-5z"
            fill="none"
            stroke="none"
        />
        {/* Ribbon Shape */}
        <path
            d="M12.5 21L8 16c-3-3.5-3-7 0-10a6 6 0 0 1 8.5 0c3 3 3 6.5 0 10l-4.5 5"
            fill="#F472B6"
            stroke="#DB2777"
            strokeWidth="2"
        />
        {/* Loop crossover detail */}
        <path d="M10 9a3 3 0 0 1 4 0" stroke="#FCE7F3" strokeWidth="2" opacity="0.6" />
        <path d="M9 7l1 1" stroke="#DB2777" />
        <path d="M15 7l-1 1" stroke="#DB2777" />
    </svg>
);

// Backward compatibility (if needed) but we are updating Home.jsx to use specific names.
export const ToothMirrorIcon = ToothIcon; // Alias just in case

