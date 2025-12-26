import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

const ChatWindow = () => {
    const [contacts, setContacts] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const messagesEndRef = useRef(null);

    // Load Contacts
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await api.get('/messages/contacts');
                setContacts(res.data);
            } catch (err) {
                console.error("Error loading contacts", err);
            }
        };
        fetchContacts();
    }, []);

    // Load Messages when User Selected
    useEffect(() => {
        if (!selectedUser) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${selectedUser._id}`);
                setMessages(res.data);
                scrollToBottom();
            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();

        // Polling for new messages (Simulating Socket.io)
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [selectedUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!text && !file) || !selectedUser) return;

        const formData = new FormData();
        formData.append('recipientId', selectedUser._id);
        if (text) formData.append('content', text);
        if (file) formData.append('image', file);

        try {
            await api.post('/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setText('');
            setFile(null);

            // Immediate Refresh
            const res = await api.get(`/messages/${selectedUser._id}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex bg-white rounded-lg shadow h-[600px] overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/3 border-r bg-gray-50 flex flex-col">
                <div className="p-4 bg-blue-600 text-white font-bold">
                    💬 Messages
                </div>
                <div className="overflow-y-auto flex-1">
                    {contacts.length === 0 ? (
                        <p className="p-4 text-gray-500 text-sm">No conversations yet.</p>
                    ) : (
                        contacts.map(contact => (
                            <div
                                key={contact._id}
                                onClick={() => setSelectedUser(contact)}
                                className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition ${selectedUser?._id === contact._id ? 'bg-blue-100' : ''}`}
                            >
                                <p className="font-bold text-gray-800">{contact.name}</p>
                                <p className="text-xs text-gray-500 truncate">{contact.role} - {contact.specialization || 'Patient'}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b bg-white flex items-center gap-2 shadow-sm z-10">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                {selectedUser.name[0]}
                            </div>
                            <div>
                                <h3 className="font-bold">{selectedUser.name}</h3>
                                {selectedUser.role === 'doctor' && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                        Online Consultation
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.recipient === selectedUser._id; // Logic check: Sent by me to them
                                return (
                                    <div key={idx} className={`flex ${msg.sender === selectedUser._id ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-lg shadow-sm ${msg.sender === selectedUser._id ? 'bg-white border' : 'bg-blue-600 text-white'}`}>
                                            {msg.attachment && (
                                                <img
                                                    src={`http://localhost:5000${msg.attachment}`}
                                                    alt="attachment"
                                                    className="w-full h-auto rounded mb-2 border border-black/10"
                                                />
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            <span className={`text-[10px] block mt-1 ${msg.sender === selectedUser._id ? 'text-gray-400' : 'text-blue-100'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2 items-end">
                            {file && (
                                <div className="absolute bottom-20 left-4 bg-gray-800 text-white text-xs p-2 rounded flex items-center gap-2">
                                    📎 {file.name}
                                    <button type="button" onClick={() => setFile(null)} className="hover:text-red-300">✕</button>
                                </div>
                            )}

                            <label className="cursor-pointer text-gray-500 hover:text-blue-600 p-2">
                                📷
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </label>

                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder={`Message ${selectedUser.name}...`}
                                className="flex-1 p-2 border rounded resize-none focus:outline-none focus:border-blue-500"
                                rows="1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                            ></textarea>

                            <button
                                type="submit"
                                disabled={!text && !file}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 transition font-bold"
                            >
                                Send ➤
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="text-6xl mb-4">💬</div>
                        <p>Select a conversation to start chatting.</p>
                        <p className="text-sm">You can send photos for diagnosis.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;
