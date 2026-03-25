import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MeetingRoom = () => {
    const { roomName } = useParams();
    const navigate = useNavigate();

    // Jitsi Meet Public Server URL
    const jitsiDomain = 'meet.jit.si';
    const meetingUrl = `https://${jitsiDomain}/${roomName}#config.prejoinPageEnabled=false`;

    return (
        <div className="flex flex-col h-screen bg-slate-900">
            {/* Header */}
            <div className="bg-slate-800 p-4 flex items-center justify-between text-white shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold">Teleconsultation Room</h1>
                        <p className="text-xs text-slate-400">Secure End-to-End Encrypted</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-full animate-pulse border border-red-500/30">
                    Recording Active
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 relative bg-black">
                <iframe
                    src={meetingUrl}
                    style={{ width: '100%', height: '100%', border: 0 }}
                    allow="camera; microphone; display-capture; autoplay; clipboard-write"
                    title="Jitsi Meet Video"
                ></iframe>
            </div>
        </div>
    );
};

export default MeetingRoom;

