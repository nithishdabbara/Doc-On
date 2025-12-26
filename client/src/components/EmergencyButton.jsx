import { useState } from 'react';

const EmergencyButton = () => {
    const [active, setActive] = useState(false);

    const toggleEmergency = () => {
        setActive(!active);
        // In real app, this would route to an Emergency Dashboard or Trigger Alerts
        if (!active) {
            alert('🚨 EMERGENCY MODE ACTIVATED 🚨\n\nFinding nearest available doctors...\nNotifying Emergency Contacts...');
        }
    };

    return (
        <button
            onClick={toggleEmergency}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-lg ${active
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                }`}
        >
            <span className="text-xl">🚑</span>
            {active ? 'SOS ACTIVE' : 'Emergency'}
        </button>
    );
};

export default EmergencyButton;
