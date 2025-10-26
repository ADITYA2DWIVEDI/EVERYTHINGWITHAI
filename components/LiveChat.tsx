import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

const LiveChat: React.FC<{ user: User | null }> = ({ user }) => {
    const [room, setRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const channelRef = useRef<BroadcastChannel | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get('room');
        if (roomFromUrl) {
            setRoom(roomFromUrl.toUpperCase());
        }
    }, []);

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (room && user?.email) {
            const channel = new BroadcastChannel(`livechat_${room}`);
            channel.onmessage = (event) => {
                const newMessage: ChatMessage = event.data;
                if(newMessage.sender !== user?.email) {
                    setMessages(prev => [...prev, newMessage]);
                }
            };
            channelRef.current = channel;
            
            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, document.title, url.pathname);
        }

        return () => {
            channelRef.current?.close();
            channelRef.current = null;
        };
    }, [room, user]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || !channelRef.current) return;
        
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: user.email,
            timestamp: Date.now(),
        };

        channelRef.current.postMessage(newMessage);
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
    };
    
    const createRoom = () => {
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setRoom(newRoomId);
    };

    const joinRoom = () => {
        if (roomIdInput.trim()) {
            setRoom(roomIdInput.trim().toUpperCase());
        }
    };
    
    if (!room) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto">
                <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Duo & Group Talk</h2>
                    <p className="text-gray-600 mb-6">Create a private room to chat with friends or join an existing one.</p>
                    <button onClick={createRoom} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">Create New Room</button>
                    <div className="my-4 flex items-center">
                        <hr className="flex-grow border-t border-gray-300" />
                        <span className="mx-4 text-gray-500">OR</span>
                        <hr className="flex-grow border-t border-gray-300" />
                    </div>
                    <div className="flex gap-2">
                        <input type="text" value={roomIdInput} onChange={e => setRoomIdInput(e.target.value)} placeholder="Enter Room ID" className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                        <button onClick={joinRoom} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Join</button>
                    </div>
                </div>
            </div>
        );
    }

    const roomUrl = `${window.location.origin}${window.location.pathname}?room=${room}`;

    return (
        <div className="flex flex-col h-full bg-transparent p-0 sm:p-4">
             <div className="flex flex-col sm:flex-row h-full max-w-6xl mx-auto w-full bg-white sm:rounded-2xl shadow-lg overflow-hidden">
                <div className="flex flex-col flex-1">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold">Room: {room}</h2>
                        <p className="text-sm text-gray-500">End-to-end encrypted chat (simulation). Share the room ID or QR code.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <AnimatePresence>
                            {messages.map(msg => {
                                const isCurrentUser = msg.sender === user?.email;
                                const senderInitial = isCurrentUser ? 'Y' : msg.sender.charAt(0).toUpperCase();
                                const senderName = isCurrentUser ? 'You' : msg.sender.split('@')[0];
                                const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                
                                const Avatar = () => (
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isCurrentUser ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                        <span className={`text-sm font-bold ${isCurrentUser ? 'text-white' : 'text-gray-600'}`}>{senderInitial}</span>
                                    </div>
                                );

                                return (
                                    <motion.div 
                                        key={msg.id} 
                                        layout
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isCurrentUser && <Avatar />}
                                        <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${isCurrentUser ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-gray-200 text-gray-800 rounded-bl-lg'}`}>
                                            {!isCurrentUser && <p className="text-xs font-bold text-gray-600 mb-1">{senderName}</p>}
                                            <p className="text-sm break-words">{msg.text}</p>
                                            <p className={`text-xs mt-1 text-right ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>{time}</p>
                                        </div>
                                        {isCurrentUser && <Avatar />}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-gray-200">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            <button type="submit" className="bg-blue-600 text-white font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors">&rarr;</button>
                        </form>
                    </div>
                </div>
                <div className="w-full sm:w-64 bg-gray-50 p-4 border-t sm:border-t-0 sm:border-l border-gray-200 flex flex-col items-center justify-center">
                     <h3 className="text-lg font-bold mb-2">Scan to Join</h3>
                     <p className="text-xs text-center text-gray-500 mb-4">Open this app on your phone and scan this QR code to join the chat.</p>
                     <div className="p-2 bg-white rounded-lg shadow-md">
                        <QRCodeCanvas value={roomUrl} size={160} />
                     </div>
                     <input type="text" readOnly value={roomUrl} className="mt-4 w-full text-xs text-center bg-gray-200 rounded p-1 border border-gray-300" />
                </div>
             </div>
        </div>
    );
};

export default LiveChat;