import React, { useState, useEffect, useCallback } from 'react';
import { generateVideo } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoIcon } from './icons/VideoIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import type { VideoHistoryItem } from '../types';

const loadingMessages = [
    "Warming up the digital director...",
    "Casting pixels for their roles...",
    "Storyboarding your vision into frames...",
    "Compositing a digital masterpiece...",
    "Rendering the final cut, just for you...",
    "Adjusting the lighting and color grade...",
];

const getInitialHistory = (): VideoHistoryItem[] => {
    try {
        const item = localStorage.getItem('video-generation-history');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        return [];
    }
};

const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [history, setHistory] = useState<VideoHistoryItem[]>(getInitialHistory);
    
    useEffect(() => {
        localStorage.setItem('video-generation-history', JSON.stringify(history));
    }, [history]);

    useEffect(() => {
        let messageInterval: number;
        if (isLoading) {
            setLoadingStatus(loadingMessages[0]);
            let i = 1;
            messageInterval = window.setInterval(() => {
                setLoadingStatus(loadingMessages[i % loadingMessages.length]);
                i++;
            }, 4000);
        }
        return () => clearInterval(messageInterval);
    }, [isLoading]);

    const checkApiKey = useCallback(async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        }
    }, []);

    useEffect(() => { checkApiKey() }, [checkApiKey]);
    
    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;
        
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);

        try {
            const videoUrl = await generateVideo(prompt, aspectRatio, resolution, setLoadingStatus);
            setGeneratedVideoUrl(videoUrl);
            const newItem: VideoHistoryItem = { id: `vid-${Date.now()}`, prompt, videoUrl, timestamp: Date.now() };
            setHistory(prev => [newItem, ...prev.slice(0, 4)]);
        } catch (e: unknown) {
            const err = e as Error;
            let errorMessage = err.message || 'An unknown error occurred.';

            // Attempt to parse the error message if it's a JSON string
            if (errorMessage.startsWith('{') && errorMessage.endsWith('}')) {
                try {
                    const errorObj = JSON.parse(errorMessage);
                    if (errorObj.error && errorObj.error.message) {
                        errorMessage = errorObj.error.message;
                    } else if (errorObj.message) {
                        errorMessage = errorObj.message;
                    }
                } catch (parseError) {
                    console.warn("Could not parse error message as JSON:", errorMessage);
                }
            }

            // Further refinement for known error types
            if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("exceeded your current quota")) {
                errorMessage = "You have exceeded your API quota. Please check your plan and billing details on the Google AI Platform console.";
            } else if (errorMessage.includes("Requested entity was not found")) {
                errorMessage = "API Key is invalid or not found. Please select a valid key.";
                setApiKeySelected(false);
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderMainContent = () => {
        if (isLoading) return (
            <div className="text-center">
                <LoadingSpinner className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-semibold mt-4 text-gray-800">Generating Your Video</h3>
                <AnimatePresence mode="wait">
                    <motion.p key={loadingStatus} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="text-gray-600 mt-2">
                        {loadingStatus}
                    </motion.p>
                </AnimatePresence>
            </div>
        );

        if (generatedVideoUrl) return (
            <div className="w-full max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-center mb-4 text-gray-800">Your Video is Ready!</h3>
                <video src={generatedVideoUrl} controls className="w-full rounded-lg shadow-lg" />
                <a href={generatedVideoUrl} download={`everythingwithai-video.mp4`} className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors">
                   <DownloadIcon className="w-5 h-5" /> Download Video
                </a>
                <button onClick={() => setGeneratedVideoUrl(null)} className="mt-2 w-full text-blue-600 hover:underline">Create another video</button>
            </div>
        );

        return (
            <div className="w-full max-w-2xl mx-auto">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <VideoIcon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">AI Video Generation</h2>
                    <p className="text-gray-600 mt-2">Bring your ideas to life. Describe a scene and let our AI create a video for you.</p>
                </div>
                 {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                        <strong className="font-bold">Error:</strong>
                        <p className="mt-1">{error}</p>
                    </div>
                )}
                {!apiKeySelected ? (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg text-left">
                        <h4 className="font-bold">Action Required</h4>
                        <p className="text-sm mb-4">
                            To use the video generation feature, you must select an API key. Please review the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-semibold">billing documentation</a> for details.
                        </p>
                        <button onClick={handleSelectKey} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            Select API Key
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A majestic lion waking up at sunrise on the savanna" className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 min-h-[120px]" rows={4} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
                                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="16:9">16:9 (Landscape)</option>
                                    <option value="9:16">9:16 (Portrait)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                                <select value={resolution} onChange={(e) => setResolution(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="720p">720p (Fast)</option>
                                    <option value="1080p">1080p (High Quality)</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleGenerate} disabled={!prompt.trim()} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Generate Video
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-transparent p-4 sm:p-6">
            <div className="flex-1 flex items-center justify-center">
                {renderMainContent()}
            </div>
             {history.length > 0 && !generatedVideoUrl && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-center text-gray-700 mb-4">Recent Creations</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {history.map(item => (
                            <div key={item.id} className="group relative rounded-lg overflow-hidden shadow-md cursor-pointer" onClick={() => setGeneratedVideoUrl(item.videoUrl)}>
                                <video src={item.videoUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs line-clamp-2">{item.prompt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;