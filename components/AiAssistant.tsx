import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from "@google/genai";
import type { Message, ImagePart, User } from '../types';
import { startChat, sendMessageStream } from '../services/geminiService';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { AiIcon } from './icons/AiIcon';

interface AiAssistantProps {
    user: User | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ user }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setChat(startChat());
        // Clear messages when user changes
        setMessages([]);
    }, [user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = useCallback(async (prompt: string, image?: ImagePart) => {
        if (!chat || isLoading || (!prompt.trim() && !image)) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: prompt,
            image: image ? `data:${image.inlineData.mimeType};base64,${image.inlineData.data}` : undefined,
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);
        
        // Add a placeholder for the model's response
        const modelMessageId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

        try {
            const stream = sendMessageStream(chat, prompt, image);
            for await (const chunk of stream) {
                setMessages(prev => prev.map(msg => {
                    if (msg.id === modelMessageId) {
                        return {
                            ...msg,
                            content: msg.content + (chunk.textChunk || ''),
                            sources: chunk.sources ? (msg.sources || []).concat(chunk.sources) : msg.sources,
                        };
                    }
                    return msg;
                }));
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            setMessages(prev => prev.map(msg =>
                msg.id === modelMessageId
                    ? { ...msg, content: `Sorry, something went wrong: ${errorMessage}` }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading]);
    
    const sampleQuestions = [
        "What were the key announcements from the last Apple event?",
        "Explain the theory of relativity in simple terms.",
        "What are the best practices for React performance optimization in 2024?",
    ];

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto h-full">
                    {messages.length === 0 ? (
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
                                {messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <ChatMessage message={message} isLoading={isLoading && message.id === messages[messages.length - 1].id} />
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