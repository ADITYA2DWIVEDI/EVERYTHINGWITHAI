import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import type { Source, ImagePart } from '../types';

// Assume process.env.API_KEY is available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export function startChat(): Chat {
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

    // FIX: The `sendMessageStream` method expects a `message` property in its parameter object.
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
    const prompt = `Create a short, ${level}-level language lesson for learning ${language} about "${topic}". The lesson should be engaging and structured. Include these sections: 1. Key Vocabulary with translations. 2. Two simple example dialogues. 3. A quick quiz with 3 multiple-choice questions and provide the answers at the end. Format the entire output in Markdown.`;
    
    try {
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