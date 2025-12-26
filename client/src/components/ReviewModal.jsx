import { useState } from 'react';
import api from '../utils/api';

const ReviewModal = ({ appointmentId, onClose, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/reviews', { appointmentId, rating, comment });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to submit review');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 className="text-xl font-bold mb-4">Rate Your Visit</h3>
                {error && <p className="text-red-500 mb-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-1">Rating</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="w-full border p-2 rounded"
                        >
                            <option value="5">⭐⭐⭐⭐⭐ Excellent (5)</option>
                            <option value="4">⭐⭐⭐⭐ Good (4)</option>
                            <option value="3">⭐⭐⭐ Average (3)</option>
                            <option value="2">⭐⭐ Poor (2)</option>
                            <option value="1">⭐ Terrible (1)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1">Comment</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border p-2 rounded"
                            rows="3"
                            required
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">Cancel</button>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Submit Review</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
