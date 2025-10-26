import React, { useState } from 'react';
import { getLanguageLesson, generateSpeech } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { motion } from 'framer-motion';
import { SpeakerIcon } from './icons/SpeakerIcon';

const LanguageLearner: React.FC = () => {
    const [language, setLanguage] = useState('Spanish');
    const [level, setLevel] = useState('Beginner');
    const [topic, setTopic] = useState('Ordering Food');
    const [lesson, setLesson] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const languages = ['Spanish', 'French', 'German', 'Japanese', 'Italian', 'Korean'];
    const levels = ['Beginner', 'Intermediate', 'Advanced'];
    const topics = ['Ordering Food', 'Greetings', 'Travel', 'Shopping', 'Business'];

    const handleGenerateLesson = async () => {
        setIsLoading(true);
        setLesson(null);
        const generatedLesson = await getLanguageLesson(language, level, topic);
        setLesson(generatedLesson);
        setIsLoading(false);
    };

    const handleSpeak = async (text: string) => {
        if(isSpeaking) return;
        setIsSpeaking(true);
        try {
            // Mapping to available TTS voices, can be expanded
            const voiceMap: { [key: string]: string } = {
                'Spanish': 'Puck',
                'French': 'Charon',
                'German': 'Kore',
                'Italian': 'Puck',
                'Japanese': 'Kore',
                'Korean': 'Kore'
            }
            const voice = voiceMap[language] || 'Zephyr';
            const audioBuffer = await generateSpeech(text, voice);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            source.onended = () => setIsSpeaking(false);
        } catch (error) {
            console.error("Speech generation failed", error);
            alert("Sorry, could not generate pronunciation for this word.");
            setIsSpeaking(false);
        }
    }

    const Speakable = ({ children }: { children: React.ReactNode }) => {
        const text = React.Children.toArray(children).join('');
        return (
            <span className="inline-flex items-center gap-1">
                <strong>{text}</strong>
                <button onClick={() => handleSpeak(text)} disabled={isSpeaking} className="text-blue-500 hover:text-blue-700 disabled:text-gray-400">
                    <SpeakerIcon className="w-4 h-4" />
                </button>
            </span>
        );
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-transparent">
            <div className="p-6 border-b border-gray-200 bg-white">
                <h2 className="text-2xl font-bold text-gray-800">Language Learner</h2>
                <p className="text-gray-600">Generate a custom AI-powered language lesson with pronunciation.</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    {/* Selectors */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Language</label>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            {languages.map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Level</label>
                        <select value={level} onChange={e => setLevel(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            {levels.map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Topic</label>
                        <select value={topic} onChange={e => setTopic(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            {topics.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="self-end">
                        <motion.button 
                            onClick={handleGenerateLesson} 
                            disabled={isLoading} 
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? 'Generating...' : 'Generate Lesson'}
                        </motion.button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-6">
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner className="w-10 h-10 text-blue-600" />
                    </div>
                )}
                {lesson ? (
                    <div className="prose lg:prose-lg max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                            speak: Speakable
                        }}>
                            {lesson}
                        </ReactMarkdown>
                    </div>
                ) : (
                    !isLoading && <p className="text-center text-gray-500">Your lesson will appear here.</p>
                )}
            </div>
        </div>
    );
};

export default LanguageLearner;
