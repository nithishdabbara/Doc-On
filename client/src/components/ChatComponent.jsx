import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

// const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
const socket = { emit: () => {}, on: () => {}, off: () => {} }; // Dummy to prevent crashes

const ChatComponent = ({ roomId, senderId, senderRole, receiverId, receiverRole }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!roomId) return;

        // Fetch History
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/chat/${roomId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        };
        fetchHistory();

        // Join Room
        socket.emit('join_room', roomId);

        // Listen for messages
        const handleReceiveMessage = (data) => {
            if (data.roomId === roomId) {
                setMessages((prev) => [...prev, data]);
            }
        };

        socket.on('receive_message', handleReceiveMessage);

        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [roomId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (newMessage.trim() === "") return;

        const messageData = {
            roomId,
            senderId,
            senderRole,
            receiverId,
            receiverRole,
            message: newMessage,
            timestamp: new Date(),
        };

        // Optimistic Update
        setMessages((prev) => [...prev, messageData]);
        setNewMessage("");

        try {
            await socket.emit('send_message', messageData);
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center rounded-t-lg">
                <span className="font-semibold text-gray-700 text-sm">Chat with {receiverRole === 'doctor' ? 'Doctor' : 'Patient'}</span>
                <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px] min-h-[200px] bg-white">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-xs mt-10">No messages yet. Say hello! 👋</div>
                )}
                {messages.map((msg, idx) => {
                    const isMyMessage = msg.senderId === senderId;
                    return (
                        <div key={idx} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm ${isMyMessage
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                                }`}>
                                <p>{msg.message}</p>
                                <span className={`text-[10px] block text-right mt-1 ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t bg-gray-50 rounded-b-lg flex gap-2">
                <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                    disabled={!newMessage.trim()}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send-horizontal"><path d="m3 3 3 9-3 9 19-9Z" /><path d="M6 12h16" /></svg>
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;
