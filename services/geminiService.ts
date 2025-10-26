import { GoogleGenAI, Chat, GenerateContentResponse, Part, Modality } from "@google/genai";
import type { Source, ImagePart } from '../types';
import { decode, decodeAudioData } from '../utils/audioUtils';

// Assume process.env.API_KEY is available
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

export function startChat(): Chat {
    const ai = getAiClient();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
}

export async function* sendMessageStream(
    chat: Chat, 
    message: string, 
    image?: ImagePart
): AsyncGenerator<{ textChunk?: string; sources?: Source[] }> {
    const parts: Part[] = [{ text: message }];
    if (image) {
        parts.unshift(image);
    }

    const result = await chat.sendMessageStream({ message: parts });

    let lastResponse: GenerateContentResponse | null = null;
    for await (const chunk of result) {
        if (chunk.text) {
             yield { textChunk: chunk.text };
        }
        lastResponse = chunk;
    }

    if (lastResponse) {
        const groundingMetadata = lastResponse.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
            const sources = groundingMetadata.groundingChunks
                .map(chunk => ({
                    uri: chunk.web?.uri ?? '',
                    title: chunk.web?.title ?? 'Untitled Source',
                }))
                .filter(source => source.uri);
            
            if (sources.length > 0) {
                 yield { sources };
            }
        }
    }
}

export async function getLanguageLesson(language: string, level: string, topic: string): Promise<string> {
    const prompt = `Create a short, ${level}-level language lesson for learning ${language} about "${topic}". The lesson should be engaging and structured. Include these sections: 1. Key Vocabulary with translations. 2. Two simple example dialogues. 3. A quick quiz with 3 multiple-choice questions and provide the answers at the end. Format the entire output in Markdown. IMPORTANT: For the vocabulary section, wrap each foreign word/phrase you want the user to be able to pronounce in <speak> tags. For example: "<speak>Hola</speak> - Hello" or "Key Phrases: <speak>¿Cómo estás?</speak> - How are you?".`;
    
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating language lesson:", error);
        return "Sorry, I couldn't generate the lesson at this moment. Please try again.";
    }
}

export async function generateVideo(
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    resolution: '1080p' | '720p',
    onPoll: (status: string) => void
): Promise<string> {
    const ai = getAiClient();
    onPoll('Starting video generation...');
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      config: {
        numberOfVideos: 1,
        resolution,
        aspectRatio,
      }
    });

    onPoll('Operation initiated. Waiting for completion...');
    
    let pollCount = 0;
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      pollCount++;
      onPoll(`Checking status (attempt ${pollCount})...`);
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation finished, but no download link was provided.');
    }
    
    onPoll('Generation complete. Fetching video data...');
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video. Status: ${response.statusText}`);
    }

    onPoll('Creating video URL...');
    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

export async function generateImage(prompt: string, aspectRatio: string): Promise<string[]> {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio as any,
        },
    });
    
    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
}

export async function editImage(prompt: string, image: ImagePart): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [image, { text: prompt }],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });
    const part = response.candidates?.[0]?.content.parts[0];
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Image editing failed to produce an image.");
}


export async function generateSpeech(text: string, voice: string): Promise<AudioBuffer> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say this with a neutral tone: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Audio generation failed.");
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const decodedData = decode(base64Audio);
  return await decodeAudioData(decodedData, audioContext, 24000, 1);
}
