import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ConversationMessage } from '../types';
import { UserIcon } from './icons/UserIcon';
import { AiIcon } from './icons/AiIcon';
import SourceList from './SourceList';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface ChatMessageProps {
    message: ConversationMessage;
    isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
    const isModel = message.role === 'model';

    return (
        <div className={`flex items-start gap-4`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'}`}>
                {isModel ? <AiIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-gray-600" />}
            </div>
            <div className={`flex-1 p-4 rounded-2xl ${isModel ? 'bg-white shadow-sm' : 'bg-blue-500 text-white'}`}>
                {message.image && (
                     <img src={message.image} alt="user upload" className="max-w-xs rounded-lg mb-2" />
                )}
                {isLoading && !message.content ? (
                     <LoadingSpinner />
                ) : (
                    <div className={`prose prose-sm sm:prose-base max-w-none ${isModel ? 'prose-slate' : 'prose-invert'}`}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className={isModel ? "text-blue-600 hover:underline" : "text-blue-200 hover:underline"} />,
                                p: ({ node, ...props }) => <p {...props} className="mb-4 last:mb-0" />,
                            }}
                        >
                            {message.content + (isLoading && message.role === 'model' ? '▍' : '')}
                        </ReactMarkdown>
                    </div>
                )}
                {message.sources && message.sources.length > 0 && (
                    <SourceList sources={message.sources} />
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
