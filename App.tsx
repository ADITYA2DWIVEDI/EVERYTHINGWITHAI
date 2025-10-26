import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from './types';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AiAssistant from './components/AiAssistant';
import LiveChat from './components/LiveChat';
import LanguageLearner from './components/LanguageLearner';
import Settings from './components/Settings';
import Plans from './components/Plans';
import Help from './components/Help';

export type Page = 'assistant' | 'livechat' | 'language' | 'settings' | 'plans' | 'help';

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4,
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<Page>('assistant');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('everything-with-ai-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogin = (loggedInUser: User) => {
        localStorage.setItem('everything-with-ai-user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
    };

    const handleLogout = useCallback(() => {
        localStorage.removeItem('everything-with-ai-user');
        setUser(null);
        setPage('assistant');
        setIsSidebarOpen(false);
    }, []);

    const handleSetPage = (newPage: Page) => {
        setPage(newPage);
        setIsSidebarOpen(false); // Close sidebar on navigation
    };

    const renderPage = () => {
        switch (page) {
            case 'assistant':
                return <AiAssistant user={user} />;
            case 'livechat':
                return <LiveChat user={user} />;
            case 'language':
                return <LanguageLearner />;
            case 'settings':
                return <Settings user={user} />;
            case 'plans':
                return <Plans />;
            case 'help':
                return <Help />;
            default:
                return <AiAssistant user={user} />;
        }
    };

    if (!user) {
        return <Auth onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar 
                currentPage={page} 
                setPage={handleSetPage} 
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={page}
                        initial="initial"
                        animate="in"
                        exit="out"
                        variants={pageVariants}
                        transition={pageTransition}
                        className="h-full"
                    >
                        {renderPage()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default App;