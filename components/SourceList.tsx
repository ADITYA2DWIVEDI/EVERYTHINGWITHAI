import React from 'react';
import type { Source } from '../types';

interface SourceListProps {
    sources: Source[];
}

const SourceList: React.FC<SourceListProps> = ({ sources }) => {
    return (
        <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-500 mb-2">Sources</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                        <span className="flex-shrink-0 w-5 h-5 text-xs bg-gray-300 rounded-full flex items-center justify-center text-gray-600">{index + 1}</span>
                        <p className="text-xs text-gray-700 truncate" title={source.title}>
                            {source.title}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default SourceList;
