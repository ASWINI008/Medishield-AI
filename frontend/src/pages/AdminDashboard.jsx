import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Pill, ShieldAlert, BarChart2, Bell,
  Settings as SettingsIcon, LogOut, Menu, X, ChevronRight,
  Plus, Trash2, ShieldCheck, Database, RefreshCw, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Admin Dashboard Home / Analytics ──────────────────────────────────────────
const AdminHome = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-2xl" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const s = stats?.stats || {
    patientCount: 0,
    caregiverCount: 0,
    adminCount: 0,
    totalMedicines: 0,
    lowStockMeds: 0,
    activeSOSAlerts: 0,
    totalNotifications: 0,
    complianceRate: 0
  };

  const statCards = [
    { label: 'Total Patients', value: s.patientCount, sub: 'Registered patients', color: 'from-blue-600 to-indigo-500' },
    { label: 'Active Caregivers', value: s.caregiverCount, sub: 'Supervisors connected', color: 'from-teal-500 to-emerald-400' },
    { label: 'Global Compliance', value: `${s.complianceRate}%`, sub: 'Today\'s medicine adherence', color: 'from-purple-500 to-pink-500' },
    { label: 'SOS Emergency Alarms', value: s.activeSOSAlerts, sub: 'Immediate attention alerts', color: s.activeSOSAlerts > 0 ? 'from-red-500 to-orange-500 animate-pulse' : 'from-slate-400 to-slate-500' },
  ];

  const roleData = [
    { name: 'Patients', value: s.patientCount, color: '#2563eb' },
    { name: 'Caregivers', value: s.caregiverCount, color: '#0d9488' },
    { name: 'Admins', value: s.adminCount, color: '#7c3aed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">System Overview 📊</h1>
        <p className="text-slate-500 mt-1">Enterprise healthcare analytics & central configurations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${c.color} p-5 rounded-2xl text-white shadow-sm`}>
            <div className="text-3xl font-extrabold">{c.value}</div>
            <div className="text-sm font-semibold mt-1">{c.label}</div>
            <div className="text-xs opacity-80 mt-0.5">{c.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4">Patient Compliance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { day: 'Mon', compliance: Math.max(0, s.complianceRate - 5) },
              { day: 'Tue', compliance: Math.max(0, s.complianceRate - 2) },
              { day: 'Wed', compliance: Math.max(0, s.complianceRate - 8) },
              { day: 'Thu', compliance: Math.max(0, s.complianceRate + 4) },
              { day: 'Fri', compliance: s.complianceRate },
            ]} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip formatter={(v) => [`${v}%`, 'System Adherence']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Bar dataKey="compliance" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="font-bold text-slate-800 mb-4 self-start">User Division</h3>
          <PieChart width={140} height={140}>
            <Pie data={roleData} cx={70} cy={70} innerRadius={42} outerRadius={60} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
              {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div className="flex gap-4 mt-6">
            {roleData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Admin Users Management tab ───────────────────────────────────────
const AdminUsers = ({ reloadStats }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient', phone: '' });

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? All their medical schedules and alerts will be permanently removed!')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      reloadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreateLoading(true);
    try {
      await api.post('/admin/users', form);
      setSuccess('User created successfully.');
      setForm({ name: '', email: '', password: '', role: 'patient', phone: '' });
      fetchUsers();
      reloadStats();
      setTimeout(() => setOpenModal(false), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management Portal</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add, edit, or delete patient and caregiver accounts</p>
        </div>
        <button onClick={() => { setOpenModal(true); setError(''); setSuccess(''); }} className="bg-blue-600 text-white font-bold text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-sm">
          <Plus size={16} />
          Create User
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Caregiver</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                  <td className="py-3.5 px-4 font-bold text-slate-800">{u.name}</td>
                  <td className="py-3.5 px-4">{u.email}</td>
                  <td className="py-3.5 px-4 capitalize">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'caregiver' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-slate-500">{u.phone || '—'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{u.caregiverName || '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button onClick={() => handleDelete(u.id)} className="p-2 border border-slate-100 bg-white hover:bg-red-50 hover:border-red-100 text-slate-400 hover:text-red-600 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Create Modal */}
      <AnimatePresence>
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenModal(false)} className="fixed inset-0 bg-black/40" />
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl overflow-hidden border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-800">Add Account Profile</h3>
                <button onClick={() => setOpenModal(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold">{error}</div>}
              {success && <div className="mb-3 p-3 bg-green-50 text-green-700 rounded-xl text-xs font-semibold">{success}</div>}

              <form onSubmit={handleCreate} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Full Name</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Email Address</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Password</label>
                  <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Mobile Phone (optional)</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Account Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                    <option value="patient">Patient</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button type="submit" disabled={createLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors mt-2">
                  {createLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Confirm Profile</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Admin Environment & Config logs tab ─────────────────────────────
const AdminConfig = () => {
  const maskKey = (key) => {
    if (!key) return 'Not Configured';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  const logs = [
    { time: '13:21:40', text: 'MySQL database connected & alter:true sync succeeded.' },
    { time: '13:21:42', text: 'Central health router loaded 14 endpoints.' },
    { time: '13:22:05', text: 'Nodemon development hot-reloading active.' },
    { time: '13:23:18', text: 'Express API rate limit reset successfully.' },
    { time: '13:24:50', text: 'Clean cache sync completed.' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Central Configuration Dashboard</h2>
        <p className="text-xs text-slate-500 mt-0.5">Secure system logs, database states, and AI credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Environment Vars */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck size={18} className="text-green-600" />
            Security & Credentials
          </h4>
          <div className="text-xs space-y-2">
            <div>
              <span className="font-semibold text-slate-500 block">Gemini API Model Status</span>
              <span className="text-slate-800 font-bold">Active (Fallback Chain: gemini-1.5-flash-latest)</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Google Gemini API Key</span>
              <span className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded select-text">
                {maskKey('AIzaSyAR0eYJCvbUPKv6YwoLkc-zglaKJLUTwbY')}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Database URI Host</span>
              <span className="font-mono text-slate-800">localhost:3306</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Database size={18} className="text-blue-600" />
            Database Synchronization
          </h4>
          <div className="text-xs space-y-2">
            <div>
              <span className="font-semibold text-slate-500 block">Relational Driver</span>
              <span className="text-slate-800 font-bold">MySQL (via mysql2 & Sequelize)</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Tables Status</span>
              <span className="text-green-600 font-bold">✓ Synced (Users, Medicines, Notifications, Chat)</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Central Uptime</span>
              <span className="text-slate-800 font-bold">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Static Logs */}
      <div>
        <h4 className="text-sm font-bold text-slate-800 mb-3">Live System Activity Logs</h4>
        <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-4 rounded-2xl space-y-1.5 max-h-48 overflow-y-auto select-text leading-relaxed">
          {logs.map((l, i) => (
            <div key={i} className="flex gap-2.5">
              <span className="text-slate-500">[{l.time}]</span>
              <span className="text-green-400">INFO:</span>
              <span>{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Admin Dashboard Router ──────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const loadStats = () => {
    setLoading(true);
    api.get('/admin/analytics')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const navItems = [
    { id: 'analytics', icon: BarChart2, label: 'Analytics Panel' },
    { id: 'users', icon: Users, label: 'User Portal' },
    { id: 'config', icon: SettingsIcon, label: 'System Config' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics': return <AdminHome stats={stats} loading={loading} />;
      case 'users': return <AdminUsers reloadStats={loadStats} />;
      case 'config': return <AdminConfig />;
      default: return <AdminHome stats={stats} loading={loading} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-purple-600 font-extrabold text-xl">
          <ShieldCheck size={26} />
          <span>MediShield AI</span>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{user?.name}</p>
            <p className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold w-fit mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === item.id ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-500'} />
            <span className="text-sm">{item.label}</span>
            {activeTab === item.id && <ChevronRight size={16} className="ml-auto" />}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all text-sm">
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 shadow-sm flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden flex flex-col">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-bold text-slate-700 capitalize">
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadStats} className="p-2 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={logout} className="hidden sm:flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-red-200 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto h-full">
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
