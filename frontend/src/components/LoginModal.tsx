import React, { useState } from 'react';
import { Lock, User as UserIcon, LogIn, AlertCircle } from 'lucide-react';
import { login } from '../api';
import { User } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await login(username, password);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-2xl space-y-6 text-slate-900">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#5E56E7] p-0.5 shadow-sm flex items-center justify-center">
            <span className="font-black text-white text-lg tracking-tight">SMV</span>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">Stamp<span className="text-[#5E56E7]">MyVisa</span> Console</h2>
            <p className="text-xs text-slate-500 font-medium">Touring Operations & Intake System</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Administrator Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7] focus:ring-2 focus:ring-[#5E56E7]/20 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#5E56E7] focus:ring-2 focus:ring-[#5E56E7]/20 transition"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#5E56E7] hover:bg-[#4F46E5] text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-purple-200" />
            <span>{isLoading ? 'Authenticating Admin...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 text-center">
          Default Admin Login: <strong className="text-slate-800">admin</strong> / <strong className="text-slate-800">admin123</strong>
        </div>

      </div>
    </div>
  );
};
