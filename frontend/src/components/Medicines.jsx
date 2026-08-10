import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pill, Pencil, Trash2, Check, AlertCircle, X, ChevronDown } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const MedicineModal = ({ medicine, onClose, onSaved }) => {
  const [form, setForm] = useState(medicine || { name: '', dosage: '', frequency: 'once', timings: ['08:00'], instructions: '', stock: 30, color: '#2563eb' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleTiming = (idx, val) => setForm(f => { const t = [...f.timings]; t[idx] = val; return { ...f, timings: t }; });
  const addTiming = () => setForm(f => ({ ...f, timings: [...f.timings, '12:00'] }));
  const removeTiming = (idx) => setForm(f => ({ ...f, timings: f.timings.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (medicine?.id) await api.put(`/medicines/${medicine.id}`, form);
      else await api.post('/medicines', form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save medicine');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{medicine?.id ? 'Edit Medicine' : 'Add New Medicine'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={22} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Medicine Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Amoxicillin" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Dosage *</label>
              <input name="dosage" value={form.dosage} onChange={handleChange} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 500mg" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Frequency</label>
              <select name="frequency" value={form.frequency} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="once">Once daily</option>
                <option value="twice">Twice daily</option>
                <option value="thrice">Three times daily</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Reminder Timings</label>
            {form.timings.map((t, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="time" value={t} onChange={e => handleTiming(i, e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                {form.timings.length > 1 && <button type="button" onClick={() => removeTiming(i)} className="text-red-400 hover:text-red-600"><X size={18} /></button>}
              </div>
            ))}
            <button type="button" onClick={addTiming} className="text-sm text-blue-600 font-medium hover:underline">+ Add timing</button>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Instructions</label>
            <textarea name="instructions" value={form.instructions} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="e.g. Take after food" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Stock Count</label>
            <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? 'scale-125 border-slate-400' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={18} />{medicine?.id ? 'Save Changes' : 'Add Medicine'}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const MedicineCard = ({ med, onTake, onEdit, onDelete }) => {
  const today = new Date().toISOString().split('T')[0];
  const taken = med.takenDates?.includes(today);
  const stockPct = Math.min(100, Math.round((med.stock / 30) * 100));

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: med.color + '20', color: med.color }}>
            <Pill size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{med.name}</h3>
            <p className="text-xs text-slate-500">{med.dosage}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(med)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={16} /></button>
          <button onClick={() => onDelete(med.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {med.timings.map((t, i) => (
          <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>
        ))}
      </div>

      {med.instructions && <p className="text-xs text-slate-500 mb-3 italic">{med.instructions}</p>}

      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Stock</span>
          <span className={med.stock <= 5 ? 'text-red-500 font-bold' : 'text-slate-600'}>{med.stock} tablets</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${stockPct}%`, backgroundColor: med.stock <= 5 ? '#ef4444' : med.color }} />
        </div>
      </div>

      {med.stock <= med.refillAt && (
        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 mb-3">
          <AlertCircle size={14} /> <span>Refill soon!</span>
        </div>
      )}

      <button onClick={() => onTake(med.id)} disabled={taken}
        className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${taken ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
        {taken ? '✓ Taken Today' : 'Mark as Taken'}
      </button>
    </motion.div>
  );
};

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [search, setSearch] = useState('');

  const fetchMedicines = async () => {
    try { const res = await api.get('/medicines'); setMedicines(res.data.medicines); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedicines(); }, []);

  const handleTake = async (id) => {
    await api.post(`/medicines/${id}/take`, { date: new Date().toISOString().split('T')[0] });
    fetchMedicines();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this medicine?')) return;
    await api.delete(`/medicines/${id}`);
    fetchMedicines();
  };

  const filtered = medicines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Medicine Management</h2>
          <p className="text-slate-500 text-sm">{medicines.length} medicines in your schedule</p>
        </div>
        <button onClick={() => { setEditMed(null); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Add Medicine
        </button>
      </div>

      <div className="mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Search medicines..." />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Pill size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No medicines found</p>
          <p className="text-sm">Add your first medicine using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(med => (
              <MedicineCard key={med.id} med={med} onTake={handleTake} onEdit={(m) => { setEditMed(m); setShowModal(true); }} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {showModal && <MedicineModal medicine={editMed} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchMedicines(); }} />}
    </div>
  );
};

export default Medicines;
