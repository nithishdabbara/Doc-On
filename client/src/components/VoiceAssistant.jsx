import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const navigate = useNavigate();

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        return null; // Hide if not supported
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    const toggleListen = () => {
        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
            setTranscript('Listening...');
        }
    };

    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setTranscript(`Heard: "${command}"`);
        setIsListening(false);
        processCommand(command);
    };

    recognition.onerror = (event) => {
        console.error("Voice Error:", event.error);
        setIsListening(false);
        setTranscript('Try again...');
    };

    const processCommand = (cmd) => {
        if (cmd.includes('dashboard') || cmd.includes('home')) {
            navigate('/dashboard');
        } else if (cmd.includes('book') || cmd.includes('appointment')) {
            navigate('/book-appointment');
        } else if (cmd.includes('profile') || cmd.includes('settings')) {
            navigate('/dashboard?tab=settings');
        } else if (cmd.includes('record') || cmd.includes('report')) {
            navigate('/dashboard?tab=records');
        } else {
            setTranscript('Unknown command');
        }

        // Clear text after a delay
        setTimeout(() => setTranscript(''), 3000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {transcript && (
                <div className="bg-black text-white text-xs px-3 py-1 rounded-full opacity-80 animate-fade-in">
                    {transcript}
                </div>
            )}
            <button
                onClick={toggleListen}
                className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-110 ${isListening
                        ? 'bg-red-500 animate-pulse ring-4 ring-red-200'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {isListening ? (
                    <span className="text-2xl">🛑</span>
                ) : (
                    <span className="text-2xl">🎙️</span>
                )}
            </button>
        </div>
    );
};

export default VoiceAssistant;
