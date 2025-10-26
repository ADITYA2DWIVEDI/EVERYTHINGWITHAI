import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { ImagePart } from '../types';

interface ChatInputProps {
    onSend: (message: string, image?: ImagePart) => void;
    disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const [message, setMessage] = useState('');
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result.split(',')[1]);
                } else {
                    reject(new Error("Failed to convert blob to base64"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [message]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() && !image) return;

        let imagePart: ImagePart | undefined = undefined;
        if (image) {
            const base64Data = await blobToBase64(image.file);
            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: image.file.type,
                }
            };
        }

        onSend(message.trim(), imagePart);
        setMessage('');
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-300 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow duration-200">
            {image && (
                <div className="p-2">
                    <img src={image.preview} alt="upload preview" className="max-h-24 rounded-lg" />
                    <button type="button" onClick={() => setImage(null)} className="text-xs text-red-500 mt-1">Remove</button>
                </div>
            )}
            <div className="flex items-end space-x-2 md:space-x-4">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                 />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 rounded-full transition-colors duration-200 disabled:text-gray-300 hover:bg-gray-200"
                >
                    <PaperclipIcon className="w-5 h-5" />
                </button>
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    className="flex-1 bg-transparent resize-none focus:outline-none p-2 text-gray-800 placeholder-gray-500 max-h-48"
                    disabled={disabled}
                />
                <motion.button
                    type="submit"
                    disabled={disabled || (!message.trim() && !image)}
                    className="w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full text-white transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.1, rotate: -15 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <SendIcon className="w-5 h-5" />
                </motion.button>
            </div>
        </form>
    );
};

export default ChatInput;