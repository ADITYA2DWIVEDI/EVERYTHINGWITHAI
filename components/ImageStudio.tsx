import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { generateImage, editImage } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { ImageIcon } from './icons/ImageIcon';
import { ImagePart } from '../types';

const ImageStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingImage, setEditingImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => reader.result ? resolve((reader.result as string).split(',')[1]) : reject();
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        try {
            const images = await generateImage(prompt, aspectRatio);
            setGeneratedImages(images);
        } catch (e: any) {
            setError(e.message || 'Failed to generate image.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEdit = async () => {
        if (!editPrompt.trim() || !editingImage || isEditing) return;
        setIsEditing(true);
        setError(null);
        try {
            const response = await fetch(editingImage);
            const blob = await response.blob();
            const base64Data = await blobToBase64(blob);
            const imagePart: ImagePart = {
                inlineData: { data: base64Data, mimeType: blob.type }
            };
            const editedImageUrl = await editImage(editPrompt, imagePart);
            setGeneratedImages(prev => [editedImageUrl, ...prev.filter(img => img !== editingImage)]);
            setEditingImage(null);
            setEditPrompt('');
        } catch (e: any) {
            setError(e.message || 'Failed to edit image.');
        } finally {
            setIsEditing(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setEditingImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-transparent p-4 sm:p-6">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">AI Image Studio</h2>
                <p className="text-gray-600 mt-2">Generate stunning visuals from text or edit existing images with AI.</p>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., An astronaut riding a horse on Mars, photorealistic"
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 md:col-span-2"
                        rows={2}
                    />
                    <div className="space-y-2">
                        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
                            <option value="1:1">1:1 (Square)</option>
                            <option value="16:9">16:9 (Landscape)</option>
                            <option value="9:16">9:16 (Portrait)</option>
                            <option value="4:3">4:3</option>
                            <option value="3:4">3:4</option>
                        </select>
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                            {isLoading ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
                 <div className="text-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-600 hover:underline">Or upload an image to edit</button>
                </div>
            </div>

            <div className="flex-1 mt-6">
                {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner className="w-10 h-10" /></div>}
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                {generatedImages.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {generatedImages.map((src, i) => (
                            <motion.div key={i} className="relative group rounded-lg overflow-hidden shadow-lg" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                                <img src={src} alt={`generated image ${i}`} className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingImage(src)} className="bg-white text-black font-semibold py-2 px-4 rounded-lg">Edit</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {editingImage && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative">
                        <button onClick={() => setEditingImage(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">&times;</button>
                        <h3 className="text-xl font-bold mb-4">Edit Image</h3>
                        <img src={editingImage} alt="editing preview" className="w-full max-h-64 object-contain rounded-lg mb-4" />
                        <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} placeholder="e.g., Add a futuristic city in the background" rows={2} className="w-full p-2 border border-gray-300 rounded-md" />
                        <button onClick={handleEdit} disabled={isEditing} className="w-full mt-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                            {isEditing ? 'Applying Edit...' : 'Apply Edit'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageStudio;
