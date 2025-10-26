import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from "@google/genai";
import type { Conversation, ConversationMessage, ImagePart, User } from '../types';
import { startChat, sendMessageStream } from '../services/geminiService';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { AiIcon } from './icons/AiIcon';
import { PlusIcon } from './icons/PlusIcon';


const getInitialConversations = (userId: string): Conversation[] => {
    try {
        const item = localStorage.getItem(`conversations-${userId}`);
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.error('Failed to parse conversations from localStorage', error);
        return [];
    }
};

const AiAssistant: React.FC<{ user: User | null }> = ({ user }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>(user ? getInitialConversations(user.email) : []);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        if (user) {
            const userConversations = getInitialConversations(user.email);
            setConversations(userConversations);
            if (userConversations.length > 0) {
                setActiveConversationId(userConversations[userConversations.length - 1].id);
            } else {
                handleNewChat();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

     useEffect(() => {
        if (user) {
            localStorage.setItem(`conversations-${user.email}`, JSON.stringify(conversations));
        }
    }, [conversations, user]);

    useEffect(() => {
        // A new chat instance is created for each conversation
        setChat(startChat());
    }, [activeConversationId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [activeConversation?.messages, isLoading]);
    
    const handleNewChat = useCallback(() => {
        const newConversation: Conversation = {
            id: `convo-${Date.now()}`,
            title: "New Chat",
            messages: [],
        };
        setConversations(prev => [...prev, newConversation]);
        setActiveConversationId(newConversation.id);
    }, []);

    const handleSend = useCallback(async (prompt: string, image?: ImagePart) => {
        if (!chat || isLoading || (!prompt.trim() && !image) || !activeConversationId) return;

        const userMessage: ConversationMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            image: image ? `data:${image.inlineData.mimeType};base64,${image.inlineData.data}` : undefined,
        };

        const modelMessageId = (Date.now() + 1).toString();
        const modelMessagePlaceholder: ConversationMessage = { id: modelMessageId, role: 'model', content: '' };

        setConversations(prev => prev.map(c => 
            c.id === activeConversationId
                ? { ...c, messages: [...c.messages, userMessage, modelMessagePlaceholder] }
                : c
        ));

        setIsLoading(true);
        setError(null);

        try {
            const stream = sendMessageStream(chat, prompt, image);
            for await (const chunk of stream) {
                setConversations(prev => prev.map(c => {
                    if (c.id === activeConversationId) {
                        return {
                            ...c,
                            messages: c.messages.map(msg => 
                                msg.id === modelMessageId
                                    ? {
                                        ...msg,
                                        content: msg.content + (chunk.textChunk || ''),
                                        sources: chunk.sources ? (msg.sources || []).concat(chunk.sources) : msg.sources,
                                    }
                                    : msg
                            ),
                        };
                    }
                    return c;
                }));
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
             setConversations(prev => prev.map(c => 
                c.id === activeConversationId
                    ? { ...c, messages: c.messages.map(msg => msg.id === modelMessageId ? { ...msg, content: `Sorry, something went wrong: ${errorMessage}` } : msg) }
                    : c
            ));
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading, activeConversationId]);
    
    const sampleQuestions = [
        "What were the key announcements from the last Apple event?",
        "Explain the theory of relativity in simple terms.",
        "What are the best practices for React performance optimization in 2024?",
    ];

    return (
        <div className="flex flex-col h-full bg-transparent">
            <header className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-700">{activeConversation?.title || 'AI Assistant'}</h2>
                <button 
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" /> New Chat
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto h-full">
                    {(!activeConversation || activeConversation.messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                                <AiIcon className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">AI Assistant</h1>
                            <p className="text-gray-500 mb-8">Your conversational search and creation engine.</p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full px-4">
                                {sampleQuestions.map((q, i) => (
                                    <button key={i} onClick={() => handleSend(q)} className="bg-white p-4 rounded-lg text-left hover:bg-gray-200 transition-colors duration-200 border border-gray-200 shadow-sm">
                                        <p className="font-semibold text-gray-700">{q}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <AnimatePresence>
                                {activeConversation.messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChatMessage message={message} isLoading={isLoading && message.id === activeConversation.messages[activeConversation.messages.length - 1].id} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                     {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg max-w-4xl mx-auto">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>
            </div>
            <footer className="sticky bottom-0 left-0 right-0 bg-gray-100/80 backdrop-blur-sm border-t border-gray-200">
                <div className="max-w-4xl mx-auto p-4">
                    <ChatInput onSend={handleSend} disabled={isLoading} />
                    <p className="text-center text-xs text-gray-500 mt-2">
                        EverythingWithAI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AiAssistant;
