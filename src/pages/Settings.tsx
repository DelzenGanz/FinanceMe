// ============================================================
// FinanceMe — Settings Page
// Profile edit, PIN change, category management, DB info.
// ============================================================

import { useEffect, useState } from 'react';
import { api } from '../api/ipc';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/shared/Modal';
import {
  User, Lock, Database, Palette,
  Plus, Pencil, Trash2, Check, Copy,
} from 'lucide-react';
import { formatNumberWithSeparators, parseCurrency } from '../utils/formatCurrency';
import type { Category } from '../../electron/database/types';

const CATEGORY_COLORS = [
  '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#6366F1',
  '#EC4899', '#14B8A6', '#8B5CF6', '#F97316', '#A855F7',
  '#84CC16', '#06B6D4',
];

const Settings = () => {
  const { user, updateUser } = useAuthStore();

  // Profile
  const [name, setName] = useState(user?.name ?? '');
  const [income, setIncome] = useState(formatNumberWithSeparators(user?.monthly_income ?? 0));
  const [currency, setCurrency] = useState(user?.currency ?? 'IDR');
  const [profileSaved, setProfileSaved] = useState(false);

  // PIN
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense'>('expense');
  const [catColor, setCatColor] = useState('#6366F1');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catError, setCatError] = useState('');

  // DB
  const [dbPath, setDbPath] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [cats, path, version] = await Promise.all([
        api.categories.getAll(),
        api.settings.getDbPath(),
        api.settings.getAppVersion(),
      ]);
      setCategories(cats);
      setDbPath(path);
      setAppVersion(version);
    } catch (err) { console.error(err); }
  };

  // ── Profile ──
  const handleSaveProfile = async () => {
    try {
      const result = await api.auth.updateProfile({
        name: name.trim(),
        monthly_income: parseCurrency(income),
        currency,
      });
      if (result.success && result.user) {
        updateUser(result.user);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2000);
      }
    } catch (err) { console.error(err); }
  };

  // ── PIN ──
  const handleChangePin = async () => {
    setPinError('');
    setPinSuccess(false);

    if (currentPin.length !== 6) { setPinError('PIN lama harus 6 digit'); return; }
    if (newPin.length !== 6) { setPinError('PIN baru harus 6 digit'); return; }
    if (newPin !== confirmPin) { setPinError('PIN baru tidak cocok'); return; }

    try {
      const verify = await api.auth.verifyPin(currentPin);
      if (!verify.success) { setPinError('PIN lama salah'); return; }

      const result = await api.auth.setPin(newPin);
      if (result.success) {
        setPinSuccess(true);
        setCurrentPin(''); setNewPin(''); setConfirmPin('');
        setTimeout(() => setPinSuccess(false), 2000);
      }
    } catch { setPinError('Gagal mengubah PIN'); }
  };

  // ── Categories ──
  const openCreateCat = () => {
    setEditingCat(null);
    setCatName(''); setCatType('expense'); setCatColor('#6366F1'); setCatIcon('Tag'); setCatError('');
    setIsCatModalOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name); setCatType(cat.type); setCatColor(cat.color); setCatIcon(cat.icon ?? 'Tag'); setCatError('');
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async () => {
    if (!catName.trim()) { setCatError('Nama wajib diisi'); return; }
    try {
      if (editingCat) {
        await api.categories.update(editingCat.id, { name: catName.trim(), type: catType, color: catColor, icon: catIcon });
      } else {
        await api.categories.create({ name: catName.trim(), type: catType, color: catColor, icon: catIcon, is_default: false });
      }
      setIsCatModalOpen(false);
      loadData();
    } catch { setCatError('Gagal menyimpan'); }
  };

  const handleDeleteCat = async (id: number) => {
    await api.categories.delete(id);
    loadData();
  };

  const copyDbPath = () => {
    navigator.clipboard.writeText(dbPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-2rem)]">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Kelola profil, PIN, dan preferensi</p>
      </div>

      {/* ── Profile Section ──────────────────────── */}
      <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><User size={16} /> Profil</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Income Bulanan</label>
            <input
              type="text"
              value={income}
              onChange={e => setIncome(formatNumberWithSeparators(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Mata Uang</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="SGD">SGD</option>
              <option value="MYR">MYR</option>
            </select>
          </div>
        </div>
        <button onClick={handleSaveProfile} className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          {profileSaved ? <><Check size={16} /> Tersimpan!</> : 'Simpan Perubahan'}
        </button>
      </div>

      {/* ── Change PIN ───────────────────────────── */}
      <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Lock size={16} /> Ganti PIN</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">PIN Lama</label>
            <input type="password" maxLength={6} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">PIN Baru</label>
            <input type="password" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Konfirmasi PIN Baru</label>
            <input type="password" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••••" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {pinError && <p className="text-red-400 text-sm mt-2">{pinError}</p>}
        {pinSuccess && <p className="text-green-400 text-sm mt-2">PIN berhasil diubah!</p>}
        <button onClick={handleChangePin} className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">Ubah PIN</button>
      </div>

      {/* ── Categories Management ────────────────── */}
      <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Palette size={16} /> Kelola Kategori</h3>
          <button onClick={openCreateCat} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors">
            <Plus size={14} /> Tambah
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Expense Categories */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase">Pengeluaran</p>
            <div className="space-y-1">
              {expenseCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-slate-300">{cat.name}</span>
                    {cat.is_default && <span className="text-xs text-slate-500">(default)</span>}
                  </div>
                  {!cat.is_default && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => openEditCat(cat)} className="p-1 text-slate-400 hover:text-indigo-400"><Pencil size={12} /></button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="p-1 text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-2 uppercase">Pemasukan</p>
            <div className="space-y-1">
              {incomeCategories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors group">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-slate-300">{cat.name}</span>
                    {cat.is_default && <span className="text-xs text-slate-500">(default)</span>}
                  </div>
                  {!cat.is_default && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button onClick={() => openEditCat(cat)} className="p-1 text-slate-400 hover:text-indigo-400"><Pencil size={12} /></button>
                      <button onClick={() => handleDeleteCat(cat.id)} className="p-1 text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Database Info ─────────────────────────── */}
      <div className="bg-slate-800 rounded-xl ring-1 ring-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Database size={16} /> Informasi</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Versi App</span>
            <span className="text-sm text-slate-200">{appVersion || '1.0.0'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Lokasi Database</span>
            <div className="flex items-center gap-2">
              <code className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded max-w-[300px] truncate">{dbPath}</code>
              <button onClick={copyDbPath} className="p-1 text-slate-400 hover:text-indigo-400 transition-colors">
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Modal ────────────────────────── */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title={editingCat ? 'Edit Kategori' : 'Tambah Kategori'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama</label>
            <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Nama kategori" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipe</label>
            <div className="flex gap-2">
              <button onClick={() => setCatType('expense')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${catType === 'expense' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' : 'bg-slate-700 text-slate-400'}`}>Pengeluaran</button>
              <button onClick={() => setCatType('income')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${catType === 'income' ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30' : 'bg-slate-700 text-slate-400'}`}>Pemasukan</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map(c => (
                <button key={c} onClick={() => setCatColor(c)} className={`w-8 h-8 rounded-full transition-all ${catColor === c ? 'ring-2 ring-white scale-110' : 'ring-1 ring-slate-600'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {catError && <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-400 text-sm">{catError}</p></div>}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setIsCatModalOpen(false)} className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">Batal</button>
            <button onClick={handleSaveCat} className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">Simpan</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
