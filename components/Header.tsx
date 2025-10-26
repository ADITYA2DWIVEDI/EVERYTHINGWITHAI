import React from 'react';
import { MenuIcon } from './icons/MenuIcon';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center">
            <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-900">
                <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 ml-4">EverythingWithAI</h1>
        </header>
    );
};

export default Header;
