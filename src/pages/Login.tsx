// ============================================================
// FinanceMe — Login Page (PIN Entry)
// Shown when a user exists but is not authenticated.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/ipc';
import { Lock, ShieldCheck } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleVerifyPin = async () => {
    if (pin.length !== 6) {
      setError('PIN harus 6 digit');
      triggerShake();
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await api.auth.verifyPin(pin);

      if (result.success && result.user) {
        login(result.user);
        navigate('/', { replace: true });
      } else {
        setError('PIN salah. Coba lagi.');
        setPin('');
        triggerShake();
        inputRef.current?.focus();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(`Error: ${err?.message || String(err)}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (pin.length === 6) {
      handleVerifyPin();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      {/* Drag region */}
      <div className="fixed top-0 left-0 right-0 h-8 app-drag-region" />

      <div
        className={`bg-slate-800 rounded-2xl p-8 w-full max-w-sm border border-slate-700 shadow-2xl transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Logo & title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">💰 FinanceMe</h1>
          <p className="text-slate-400 text-sm">Masukkan PIN untuk membuka</p>
        </div>

        {/* PIN dots display */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-indigo-500 scale-110'
                  : 'bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Hidden input for PIN */}
        <input
          ref={inputRef}
          type="password"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setError('');
            setPin(e.target.value.replace(/\D/g, ''));
          }}
          className="opacity-0 absolute pointer-events-auto w-0 h-0"
          onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
        />

        {/* Clickable area to focus input */}
        <button
          onClick={() => inputRef.current?.focus()}
          className="w-full py-3 text-slate-500 text-sm hover:text-slate-400 transition-colors"
        >
          <Lock size={14} className="inline mr-1" />
          Klik di sini untuk mengetik PIN
        </button>

        {/* Error message */}
        {error && (
          <div className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isVerifying && (
          <div className="mt-3 text-center">
            <p className="text-indigo-400 text-sm">Memverifikasi PIN...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
