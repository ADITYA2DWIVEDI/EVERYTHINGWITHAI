import React, { useState } from 'react';
import type { User } from '../types';
import { AiIcon } from './icons/AiIcon';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    const handleGuestLogin = () => {
        onLogin({ email: 'guest@example.com', isGuest: true });
    };
    
    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock: In a real app, you would send an email with an OTP here.
        console.log(`Signing up with ${email}. Mock OTP is 123456`);
        setError('');
        setMode('otp');
    }

    const handleOtp = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock OTP check
        if (otp === '123456') {
            const newUser = { email, isGuest: false };
            // Mock storing the user
            localStorage.setItem(`user-${email}`, password);
            onLogin(newUser);
        } else {
            setError('Invalid OTP. Please try again.');
        }
    }
    
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login check
        const storedPassword = localStorage.getItem(`user-${email}`);
        if(storedPassword && storedPassword === password) {
             onLogin({ email, isGuest: false });
        } else {
             setError('Invalid credentials.');
        }
    }

    const renderForm = () => {
        switch (mode) {
            case 'otp':
                return (
                    <form onSubmit={handleOtp} className="space-y-4">
                        <p className="text-center text-gray-600">Enter the 6-digit code sent to {email}</p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">OTP Code</label>
                            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Verify & Sign Up</button>
                    </form>
                );
            case 'signup':
                return (
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign Up</button>
                        <p className="text-center text-sm">Already have an account? <button type="button" onClick={() => setMode('login')} className="text-blue-600 hover:underline">Log In</button></p>
                    </form>
                );
            case 'login':
            default:
                return (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Log In</button>
                        <p className="text-center text-sm">No account? <button type="button" onClick={() => setMode('signup')} className="text-blue-600 hover:underline">Sign Up</button></p>
                    </form>
                );
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <AiIcon className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">EverythingWithAI</h1>
                </div>
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                {renderForm()}
                 <div className="mt-6 text-center">
                    <button onClick={handleGuestLogin} className="text-sm text-gray-500 hover:text-gray-700">Continue as Guest</button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
