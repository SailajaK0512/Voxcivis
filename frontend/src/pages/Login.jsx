import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = ({ onNavigate, prefillRole }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'admin') onNavigate('admin');
      else if (user.role === 'worker') onNavigate('worker');
      else onNavigate('citizen');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="civic-card p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign In to VoxCivis</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter credentials to access municipal services or administrative dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter registered username"
                  className="civic-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  spellCheck="false"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`civic-input pl-9 pr-10 ${showPassword ? '' : 'secure-masked'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="civic-btn-primary w-full mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 text-center">
              Quick Role Test
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('citizen1', 'citizen123')}
                className="px-2 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className="px-2 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('worker_power', 'worker123')}
                className="px-2 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-medium text-slate-700"
              >
                Worker
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Register here
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
