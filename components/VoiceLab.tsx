import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateSpeech } from '../services/geminiService';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { VoiceIcon } from './icons/VoiceIcon';

const VoiceLab: React.FC = () => {
    const [text, setText] = useState('Hello, welcome to the AI Voice Lab! You can generate natural-sounding speech from any text.');
    const [voice, setVoice] = useState('Zephyr');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    const handleGenerate = async () => {
        if (!text.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);

        try {
            const audioBuffer = await generateSpeech(text, voice);
            
            // Convert AudioBuffer to a Blob and create an object URL
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const wav = audioBufferToWav(audioBuffer);
            const blob = new Blob([wav], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);

        } catch (e: any) {
            setError(e.message || 'Failed to generate speech.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to convert AudioBuffer to WAV format for playback and download
    function audioBufferToWav(buffer: AudioBuffer) {
        let numOfChan = buffer.numberOfChannels,
            length = buffer.length * numOfChan * 2 + 44,
            bufferArr = new ArrayBuffer(length),
            view = new DataView(bufferArr),
            channels = [], i, sample,
            offset = 0,
            pos = 0;

        // write WAV header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"
        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit
        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        function setUint16(data: number) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data: number) {
            view.setUint32(pos, data, true);
            pos += 4;
        }

        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }
        return bufferArr;
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-transparent p-4 sm:p-6">
            <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 mb-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                    <VoiceIcon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">AI Voice Lab</h2>
                <p className="text-gray-600 mt-2">Transform text into high-quality, natural-sounding audio.</p>
            </div>

            <div className="max-w-2xl mx-auto w-full space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to generate speech..."
                    className="w-full p-4 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 min-h-[150px]"
                    rows={5}
                />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select a Voice</label>
                    <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
                        {voices.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                <button onClick={handleGenerate} disabled={isLoading || !text.trim()} className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400">
                    {isLoading ? 'Generating Audio...' : 'Generate Speech'}
                </button>
                
                {error && <p className="text-red-500 text-center">{error}</p>}

                {audioUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                         <audio controls src={audioUrl} className="w-full" />
                         <a href={audioUrl} download="ai-speech.wav" className="mt-2 block text-center text-blue-600 hover:underline">Download Audio</a>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default VoiceLab;
