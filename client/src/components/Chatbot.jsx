import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, Send, X, FileText, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chatbot = ({ isOpen, onClose, isEmbedded = false, initialMessage = '', initialAttachment = null, context = 'general', isMinimized: propIsMinimized, onToggleMinimize, senderRole = 'patient' }) => {
    const [messages, setMessages] = useState([
        { type: 'bot', text: 'Hi! I am DocOn AI. Describe your symptoms (e.g., "headache and fever"), and I will suggest the right specialist.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isMaximized, setIsMaximized] = useState(true); // Default to Full Screen
    const bottomRef = useRef(null);
    const hasProcessedInitial = useRef(false);
    const fileInputRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Handle Initial Message (Analysis) with Auto-File Fetch
    useEffect(() => {
        if (isOpen && !hasProcessedInitial.current && (initialMessage || initialAttachment)) {
            hasProcessedInitial.current = true; // Mark immediately to prevent re-entry

            const processInitial = async () => {
                let fileToSend = null;

                if (initialAttachment) {
                    try {
                        console.log("Auto-fetching attachment:", initialAttachment);
                        // Fetch the file as a blob
                        const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${initialAttachment}`);
                        const blob = await response.blob();
                        const fileName = initialAttachment.split('/').pop();
                        fileToSend = new File([blob], fileName, { type: blob.type });
                        setSelectedFile(fileToSend); // Set visual state for Chatbot
                    } catch (err) {
                        console.error("Failed to auto-fetch attachment:", err);
                    }
                }

                // If we have a message OR a file to send
                if (initialMessage || fileToSend) {
                    // Slight delay to ensure UI renders before sending
                    setTimeout(() => {
                        handleSend(initialMessage, fileToSend);
                    }, 500);
                }
            };

            processInitial();
        }

        if (!isOpen) {
            hasProcessedInitial.current = false;
            setSelectedFile(null);
        }
    }, [isOpen, initialMessage, initialAttachment]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setInput((prev) => {
                if (prev) return prev;
                return `Analyze this ${file.name} `;
            });
        }
    };

    // Voice Recognition Logic
    const handleVoiceStart = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Your browser doesn't support Voice Input. Try Chrome.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
        };

        recognition.start();
    };

    const handleSend = async (textOverride = null, fileOverride = null) => {
        const textToSend = textOverride || input;
        const fileToSend = fileOverride || selectedFile;

        if (!textToSend.trim() && !fileToSend) return;

        const userMsg = {
            type: 'user',
            text: textToSend,
            file: fileToSend ? { name: fileToSend.name } : null
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedFile(null); // visual reset
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLoading(true);

        try {
            let res;
            if (fileToSend) {
                // Multimodal Request
                const formData = new FormData();
                formData.append('file', fileToSend);
                formData.append('query', textToSend || "Analyze this file.");

                res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ai/analyze`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    }
                });
            } else {
                // Text Request
                res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ai/analyze`, {
                    query: textToSend,
                    context: hasProcessedInitial.current ? 'chat' : context,
                    role: senderRole || 'patient'
                }, {
                    headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
                });
            }

            const botMsg = {
                type: 'bot',
                text: res.data.message,
                specs: res.data.specializations || [res.data.specialization],
                precautions: res.data.precautions,
                urgency: res.data.urgency
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { type: 'bot', text: "Sorry, I'm having trouble analyzing that. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const [internalMinimized, setInternalMinimized] = useState(false);

    // Controlled vs Uncontrolled logic
    const isMinimized = propIsMinimized !== undefined ? propIsMinimized : internalMinimized;
    const toggleMinimize = onToggleMinimize || (() => setInternalMinimized(!internalMinimized));

    if (!isOpen) return null;

    if (isMinimized) {
        return (
            <div className={'fixed bottom-6 right-6 z-[110] animate-fade-in'}>
                <button
                    onClick={() => toggleMinimize()}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <Bot size={24} />
                    <span className="font-bold">DocOn AI</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`${isEmbedded
            ? 'w-full h-full bg-white flex flex-col'
            : isMaximized
                ? 'fixed inset-0 w-full h-full bg-white z-[2500] flex flex-col animate-fade-in'
                : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[90vw] h-[600px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-fade-in'
            } overflow-hidden transition-all duration-300 ease-in-out`}>

            {/* Header */}
            <div className="bg-white border-b p-4 flex justify-between items-center shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                        <Bot size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 leading-tight">DocOn AI</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-[11px] text-gray-500 font-medium">Online & Ready</p>
                        </div>
                    </div>
                </div>

                {/* Window Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => toggleMinimize()}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-all"
                        title="Minimize"
                    >
                        <div className="w-4 h-0.5 bg-current rounded-full"></div>
                    </button>
                    {!isEmbedded && (
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-all"
                            title={isMaximized ? "Restore" : "Maximize"}
                        >
                            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                        title="Close"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} `}>
                        <div className={`max-w-[90%] rounded-2xl p-5 shadow-sm text-lg leading-relaxed ${msg.type === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                            } `}>

                            {/* User Attached File Preview in Chat History */}
                            {msg.file && (
                                <div className="mb-2 p-3 bg-white/20 rounded-xl flex items-center gap-3 border border-white/30">
                                    <div className="bg-white/90 p-2 rounded text-blue-600"><Bot size={18} /></div> {/* Icon Placeholder */}
                                    <span className="text-sm font-medium truncate max-w-[200px]">{msg.file.name}</span>
                                </div>
                            )}

                            <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                            {msg.precautions && (
                                <div className={`mt-4 p-4 rounded-xl border ${msg.urgency === 'High' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'
                                    } `}>
                                    <p className="font-bold text-xl mb-2 flex items-center gap-2">
                                        {msg.urgency === 'High' ? '🚨 Urgent Precautions:' : '💡 Quick Tips:'}
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 text-base font-semibold">
                                        {msg.precautions.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Actions / Suggestions */}
                            {msg.specs && msg.specs.length > 0 && (
                                <div className="mt-4 flex flex-col gap-3">
                                    {msg.specs.map((spec, i) => (
                                        <Link
                                            key={spec + i}
                                            to={`/search-doctors?search=${encodeURIComponent(spec)}`}
                                            onClick={onClose}
                                            className="block w-full text-center py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-base font-bold border border-blue-200 transition-colors shadow-sm"
                                        >
                                            Find {spec}s
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border rounded-2xl rounded-bl-none p-4 shadow-sm">
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef}></div>
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t space-y-2">
                {/* Selected File Preview (Pending Send) */}
                {selectedFile && (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 animate-fade-in">
                        <div className="bg-blue-100 p-1 rounded text-blue-600"><FileText size={14} /></div>
                        <span className="text-xs text-blue-800 font-medium truncate flex-1">{selectedFile.name}</span>
                        <button onClick={() => { setSelectedFile(null); setInput(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gray-400 hover:text-red-500">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="flex gap-2 items-center">
                    <label className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer relative group">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <FileText size={24} />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Upload Report
                        </span>
                    </label>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Describe symptoms..."}
                        className={`flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-2xl px-6 py-4 text-lg outline-none transition-all placeholder:text-gray-400 ${isListening ? 'animate-pulse border-red-400 bg-red-50' : ''}`}
                    />

                    {/* Voice Button */}
                    <button
                        onClick={handleVoiceStart}
                        className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        title="Speak Symptoms"
                    >
                        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && !selectedFile) || loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-200"
                    >
                        <Send size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;

