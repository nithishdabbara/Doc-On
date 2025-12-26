import { useState } from 'react';
import api from '../utils/api';

const PrescriptionForm = ({ patientId, onSuccess }) => {
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [notes, setNotes] = useState('');

    const handleMedChange = (index, e) => {
        const newMeds = [...medications];
        newMeds[index][e.target.name] = e.target.value;
        setMedications(newMeds);
    };

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
    };

    const removeMedication = (index) => {
        const newMeds = medications.filter((_, i) => i !== index);
        setMedications(newMeds);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/prescriptions', {
                patientId,
                medications,
                notes
            });
            onSuccess();
            setMedications([{ name: '', dosage: '', frequency: '' }]);
            setNotes('');
        } catch (err) {
            console.error('Failed to add prescription', err);
        }
    };

    return (
        <div className="bg-white p-4 rounded shadow mt-4">
            <h3 className="text-lg font-bold mb-3">Add Prescription</h3>
            <form onSubmit={onSubmit}>
                {medications.map((med, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input
                            name="name"
                            placeholder="Medication Name"
                            value={med.name}
                            onChange={e => handleMedChange(index, e)}
                            className="border p-2 rounded flex-1"
                            required
                        />
                        <input
                            name="dosage"
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={e => handleMedChange(index, e)}
                            className="border p-2 rounded w-24"
                            required
                        />
                        <input
                            name="frequency"
                            placeholder="Frequency"
                            value={med.frequency}
                            onChange={e => handleMedChange(index, e)}
                            className="border p-2 rounded w-32"
                            required
                        />
                        {medications.length > 1 && (
                            <button type="button" onClick={() => removeMedication(index)} className="text-red-500 font-bold px-2">X</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addMedication} className="text-blue-500 text-sm mb-3">+ Add Another Medication</button>

                <textarea
                    placeholder="Doctor Notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full border p-2 rounded mb-3 h-20"
                />

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
                    Issue Prescription
                </button>
            </form>
        </div>
    );
};

export default PrescriptionForm;
