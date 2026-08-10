import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Activity, Bot, FileText, ShieldAlert,
  BarChart2, Bell, Settings as SettingsIcon,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import Medicines from '../components/Medicines';
import AIAssistant from '../components/AIAssistant';
import PrescriptionScanner from '../components/PrescriptionScanner';
import EmergencyAlerts from '../components/EmergencyAlerts';
import HealthReports from '../components/HealthReports';
import Notifications from '../components/Notifications';
import Settings from '../components/Settings';

// ─── Dashboard Home ───────────────────────────────────────────────────────────
const DashboardHome = ({ user }) => {
  const [medicines, setMedicines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/medicines'), api.get('/notifications')])
      .then(([mRes, nRes]) => { setMedicines(mRes.data.medicines); setNotifications(nRes.data.notifications); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const takenToday = medicines.filter(m => m.takenDates?.includes(today)).length;
  const totalMeds = medicines.length;
  const adherence = totalMeds > 0 ? Math.round((takenToday / totalMeds) * 100) : 0;
  const unread = notifications.filter(n => !n.isRead).length;
  const lowStock = medicines.filter(m => m.stock <= m.refillAt);
  const healthScore = Math.min(100, 60 + Math.round(adherence * 0.4));

  const handleTake = async (id) => {
    await api.post(`/medicines/${id}/take`, { date: today });
    const res = await api.get('/medicines');
    setMedicines(res.data.medicines);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-slate-500 mt-1">Here's your health overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />) : [
          { label: 'Health Score', value: `${healthScore}`, unit: '/100', color: 'from-blue-500 to-cyan-400', sub: 'AI calculated' },
          { label: "Today's Adherence", value: `${adherence}`, unit: '%', color: 'from-emerald-500 to-green-400', sub: `${takenToday}/${totalMeds} taken` },
          { label: 'Notifications', value: `${unread}`, unit: '', color: 'from-violet-500 to-purple-400', sub: 'unread alerts' },
          { label: 'Low Stock', value: `${lowStock.length}`, unit: '', color: lowStock.length > 0 ? 'from-red-500 to-orange-400' : 'from-slate-400 to-slate-500', sub: 'refill needed' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${s.color} p-5 rounded-2xl text-white`}>
            <div className="text-3xl font-extrabold">{s.value}<span className="text-lg font-semibold opacity-80">{s.unit}</span></div>
            <div className="text-sm font-semibold mt-1">{s.label}</div>
            <div className="text-xs opacity-75 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Today's Medicines */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-slate-800">Today's Medicines</h2>
          {loading ? null : <span className="text-sm text-slate-500">{takenToday}/{totalMeds} taken</span>}
        </div>
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Pill size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No medicines scheduled</p>
            <p className="text-sm">Go to Medicines tab to add your first medicine</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicines.map(med => {
              const taken = med.takenDates?.includes(today);
              return (
                <div key={med.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${taken ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: (med.color || '#2563eb') + '20', color: med.color || '#2563eb' }}>
                      <Pill size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage} · {med.timings.join(', ')}</p>
                    </div>
                  </div>
                  <button onClick={() => !taken && handleTake(med.id)} disabled={taken}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${taken ? 'bg-green-500 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {taken ? '✓ Taken' : 'Mark Taken'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {!loading && lowStock.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <ShieldAlert size={24} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800">Refill Needed</h3>
            <p className="text-sm text-amber-700">{lowStock.map(m => `${m.name} (${m.stock} left)`).join(', ')}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
const SidebarItem = ({ item, active, onClick }) => (
  <button onClick={() => onClick(item.id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${active ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
    <item.icon size={20} className={active ? 'text-white' : 'text-slate-500'} />
    <span className="text-sm">{item.label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'medicines', icon: Pill, label: 'Medicines' },
    { id: 'ai-assistant', icon: Bot, label: 'AI Assistant' },
    { id: 'scanner', icon: FileText, label: 'Prescription Scanner' },
    { id: 'emergency', icon: ShieldAlert, label: 'Emergency Alerts' },
    { id: 'reports', icon: BarChart2, label: 'Health Reports' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome user={user} />;
      case 'medicines': return <Medicines />;
      case 'ai-assistant': return <AIAssistant />;
      case 'scanner': return <PrescriptionScanner />;
      case 'emergency': return <EmergencyAlerts />;
      case 'reports': return <HealthReports />;
      case 'notifications': return <Notifications />;
      case 'settings': return <Settings />;
      default: return <DashboardHome user={user} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-blue-600 font-extrabold text-xl">
          <ShieldAlert size={26} />
          <span>MediShield AI</span>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <SidebarItem key={item.id} item={item} active={activeTab === item.id}
            onClick={(id) => { setActiveTab(id); setSidebarOpen(false); }} />
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <Menu size={22} />
          </button>
          <h2 className="text-lg font-bold text-slate-700 capitalize">{navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveTab('notifications'); }}
              className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              <Bell size={20} />
            </button>
            <button onClick={logout} className="hidden sm:flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-red-200 transition-colors">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto h-full">
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating AI Button (on non-AI pages) */}
      {activeTab !== 'ai-assistant' && (
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setActiveTab('ai-assistant')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-300 z-30 hover:shadow-blue-400 transition-shadow">
          <Bot size={26} />
        </motion.button>
      )}
    </div>
  );
};

export default PatientDashboard;
