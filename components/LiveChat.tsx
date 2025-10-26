import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { User } from '../types';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

const WEBSOCKET_URL = 'ws://localhost:8080';

const LiveChat: React.FC<{ user: User | null }> = ({ user }) => {
    const [room, setRoom] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [users, setUsers] = useState<string[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);

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
            const ws = new WebSocket(WEBSOCKET_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'join', payload: { room, email: user.email } }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'message':
                            setMessages(prev => [...prev, data.payload]);
                            break;
                        case 'user-list-update':
                            setUsers(data.payload.users);
                            break;
                        case 'typing-update':
                            setTypingUsers(data.payload.typingUsers.filter((email: string) => email !== user.email));
                            break;
                    }
                } catch (error) {
                    console.error('Failed to parse message:', error);
                }
            };

            const url = new URL(window.location.href);
            url.searchParams.delete('room');
            window.history.replaceState({}, document.title, url.pathname);
        }

        return () => wsRef.current?.close();
    }, [room, user]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !user || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: user.email,
            timestamp: Date.now(),
        };

        wsRef.current.send(JSON.stringify({ type: 'message', payload: newMessage }));
        wsRef.current.send(JSON.stringify({ type: 'stop-typing' }));
        if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setInputValue('');
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        if (e.target.value.trim() !== '') {
            wsRef.current.send(JSON.stringify({ type: 'start-typing' }));
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = window.setTimeout(() => {
                wsRef.current?.send(JSON.stringify({ type: 'stop-typing' }));
            }, 3000);
        } else {
             wsRef.current.send(JSON.stringify({ type: 'stop-typing' }));
             if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        }
    };
    
    const createRoom = () => setRoom(Math.random().toString(36).substring(2, 8).toUpperCase());
    const joinRoom = () => roomIdInput.trim() && setRoom(roomIdInput.trim().toUpperCase());
    
    const typingDisplay = useMemo(() => {
        if (typingUsers.length === 0) return '';
        const names = typingUsers.map(email => email.split('@')[0]);
        if (names.length === 1) return `${names[0]} is typing...`;
        if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
        return `${names.slice(0, 2).join(', ')} and others are typing...`;
    }, [typingUsers]);
    
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
                        <p className="text-sm text-gray-500">Share the room ID or QR code to invite others.</p>
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
                     <div className="h-6 px-4 text-xs text-gray-500 italic">
                        {typingDisplay}
                    </div>
                    <div className="p-4 border-t border-gray-200">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={inputValue} onChange={handleTyping} placeholder="Type a message..." className="flex-1 px-4 py-2 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            <button type="submit" className="bg-blue-600 text-white font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-700 transition-colors">&rarr;</button>
                        </form>
                    </div>
                </div>
                <aside className="w-full sm:w-64 bg-gray-50 p-4 border-t sm:border-t-0 sm:border-l border-gray-200 flex flex-col">
                     <h3 className="text-lg font-bold mb-2">Invite Others</h3>
                     <p className="text-xs text-center text-gray-500 mb-4">Scan the QR code to join this room.</p>
                     <div className="p-2 bg-white rounded-lg shadow-md self-center">
                        <QRCodeCanvas value={roomUrl} size={128} />
                     </div>
                     <input type="text" readOnly value={roomUrl} className="mt-4 w-full text-xs text-center bg-gray-200 rounded p-1 border border-gray-300" />
                     <hr className="my-4 border-gray-200" />
                     <h3 className="text-lg font-bold mb-2">Users ({users.length})</h3>
                     <ul className="space-y-2 flex-1 overflow-y-auto">
                        {users.map(email => (
                            <li key={email} className="text-sm text-gray-700 truncate">
                                {email === user?.email ? `${email.split('@')[0]} (You)` : email.split('@')[0]}
                            </li>
                        ))}
                     </ul>
                </aside>
             </div>
        </div>
    );
};

export default LiveChat;
