// ============================================================
// FinanceMe — Onboarding Page
// Shown on first launch when no user exists in the database.
// Collects: name, monthly income, currency, 6-digit PIN.
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/ipc';
import { User, DollarSign, Lock, ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!name.trim()) {
        setError('Nama tidak boleh kosong');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
        setError('Masukkan pendapatan bulanan yang valid');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (pin.length !== 6) {
      setError('PIN harus 6 digit');
      return;
    }
    if (pin !== confirmPin) {
      setError('PIN tidak cocok');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api.auth.createUser({
        name: name.trim(),
        monthly_income: Number(monthlyIncome),
        currency,
        pin,
      });

      if (result.success && result.user) {
        login(result.user);
        navigate('/', { replace: true });
      } else {
        setError('Gagal membuat akun. Coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      {/* Drag region */}
      <div className="fixed top-0 left-0 right-0 h-8 app-drag-region" />

      <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">💰 FinanceMe</h1>
          <p className="text-slate-400">Selamat datang! Mari atur profil Anda.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-indigo-500' : s < step ? 'w-8 bg-indigo-500/50' : 'w-2 bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <User size={16} className="inline mr-2" />
                Nama Anda
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama Anda"
                autoFocus
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
              />
            </div>
          </div>
        )}

        {/* Step 2: Income & Currency */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <DollarSign size={16} className="inline mr-2" />
                Pendapatan Bulanan
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Contoh: 10000000"
                autoFocus
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mata Uang</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="IDR">IDR — Rupiah Indonesia</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="SGD">SGD — Singapore Dollar</option>
                <option value="MYR">MYR — Malaysian Ringgit</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: PIN Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Lock size={16} className="inline mr-2" />
                Buat PIN 6 Digit
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                autoFocus
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 text-center text-2xl tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Konfirmasi PIN</label>
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 text-center text-2xl tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => { setError(''); setStep((step - 1) as 1 | 2 | 3); }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-lg transition-colors"
            >
              Kembali
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Lanjut <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Membuat akun...' : 'Mulai Gunakan FinanceMe'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
