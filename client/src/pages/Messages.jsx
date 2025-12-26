import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
    const { user } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [usersList, setUsersList] = useState([]); // For starting new chats

    useEffect(() => {
        fetchContacts();
        fetchUsersList();
    }, []);

    useEffect(() => {
        if (selectedContact) {
            fetchMessages(selectedContact._id);
            // Polling for new messages
            const interval = setInterval(() => fetchMessages(selectedContact._id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedContact]);

    const fetchContacts = async () => {
        try {
            const res = await api.get('/messages/contacts');
            setContacts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchUsersList = async () => {
        try {
            // If patient, fetch doctors. If doctor, theoretically fetch patients but we don't have a public patient list endpoint yet.
            // Using existing endpoint:
            if (user.role === 'patient') {
                const res = await api.get('/users/doctors');
                setUsersList(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (contactId) => {
        try {
            const res = await api.get(`/messages/${contactId}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            await api.post('/messages', {
                recipientId: selectedContact._id,
                content: newMessage
            });
            setNewMessage('');
            fetchMessages(selectedContact._id);
            fetchContacts(); // Move to top if contacts sorted
        } catch (err) {
            console.error(err);
        }
    };

    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        // Add to contacts if not present
        if (!contacts.find(c => c._id === contact._id)) {
            setContacts([...contacts, contact]);
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded shadow overflow-hidden">
            {/* Contacts List */}
            <div className="w-1/3 border-r overflow-y-auto">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="font-bold text-lg">Messages</h2>
                    {user.role === 'patient' && (
                        <select
                            className="w-full mt-2 p-2 border rounded"
                            onChange={(e) => {
                                const contact = usersList.find(u => u._id === e.target.value);
                                if (contact) handleContactSelect(contact);
                            }}
                            value=""
                        >
                            <option value="">+ Start New Chat</option>
                            {usersList.map(u => (
                                <option key={u._id} value={u._id}>Dr. {u.name}</option>
                            ))}
                        </select>
                    )}
                </div>
                {contacts.length === 0 ? (
                    <p className="p-4 text-gray-500">No conversations yet.</p>
                ) : (
                    contacts.map(contact => (
                        <div
                            key={contact._id}
                            onClick={() => setSelectedContact(contact)}
                            className={`p-4 cursor-pointer hover:bg-gray-100 ${selectedContact?._id === contact._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                        >
                            <p className="font-semibold">{contact.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{contact.role}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="font-bold">{selectedContact.name}</h3>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-100">
                            {messages.map(msg => (
                                <div key={msg._id} className={`flex ${msg.sender === user._id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.sender === user._id ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}>
                                        <p>{msg.content}</p>
                                        <p className={`text-xs mt-1 ${msg.sender === user._id ? 'text-blue-100' : 'text-gray-500'}`}>
                                            {new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 p-2 border rounded focus:outline-none focus:border-blue-500"
                            />
                            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                                Send
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a conversation to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
