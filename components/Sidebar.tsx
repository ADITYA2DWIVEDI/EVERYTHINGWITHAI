import React from 'react';
import { motion } from 'framer-motion';
import type { Page } from '../App';
import { AiIcon } from './icons/AiIcon';
import { MessageIcon } from './icons/MessageIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { XIcon } from './icons/XIcon';

interface SidebarProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, onLogout, isOpen, setIsOpen }) => {
    const mainNavItems = [
        { id: 'assistant', label: 'AI Assistant', icon: AiIcon },
        { id: 'livechat', label: 'Live Chat', icon: MessageIcon },
        { id: 'language', label: 'Language Learner', icon: LanguageIcon },
    ];
    
    const secondaryNavItems = [
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
        { id: 'plans', label: 'Plans & Subscription', icon: CreditCardIcon },
        { id: 'help', label: 'Help & Support', icon: QuestionMarkCircleIcon },
    ];

    const NavButton: React.FC<{item: {id: string, label: string, icon: React.FC<any>}, isCurrent: boolean}> = ({item, isCurrent}) => (
         <motion.button
            onClick={() => setPage(item.id as Page)}
            className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 w-full ${
                isCurrent ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
        >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
        </motion.button>
    );

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-30 z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white flex flex-col border-r border-gray-200 p-4 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between gap-2 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <AiIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">EverythingWithAI</h1>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-gray-800">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    {mainNavItems.map(item => (
                        <NavButton key={item.id} item={item} isCurrent={currentPage === item.id} />
                    ))}
                    <hr className="my-4 border-gray-200" />
                     {secondaryNavItems.map(item => (
                        <NavButton key={item.id} item={item} isCurrent={currentPage === item.id} />
                    ))}
                </nav>
                
                <div>
                     <button
                        onClick={onLogout}
                        className="flex items-center gap-3 p-3 rounded-lg text-left w-full text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;