import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Activity, ShieldAlert, BarChart2, Bell,
  Settings as SettingsIcon, LogOut, Menu, X, ChevronRight,
  UserCheck, AlertCircle, Heart, Phone, Plus, RefreshCw, Send, BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ─── Caregiver Dashboard Home ──────────────────────────────────────────────────
const CaregiverHome = ({ setActiveTab }) => {
  const [patients, setPatients] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [sosAlerts, setSosAlerts] = useState([]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/caregiver/patients'), api.get('/notifications')])
      .then(([pRes, nRes]) => {
        setPatients(pRes.data.patients);
        // Extract unread emergency notifications
        const activeSos = nRes.data.notifications.filter(n => n.type === 'emergency' && !n.isRead);
        setSosAlerts(activeSos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    if (!emailInput) return;
    setAssignLoading(true);
    try {
      const res = await api.post('/caregiver/assign-patient', { email: emailInput });
      setAssignSuccess(res.data.message);
      setEmailInput('');
      fetchData(); // reload
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Failed to assign patient.');
    } finally {
      setAssignLoading(false);
    }
  };

  const markAllSOSRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setSosAlerts([]);
    } catch (err) {
      console.error(err);
    }
  };

  const avgAdherence = patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.adherence, 0) / patients.length) : 0;
  const criticalPatients = patients.filter(p => p.adherence < 70 || p.lowStockCount > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Caregiver Hub 👋</h1>
          <p className="text-slate-500 mt-1">Monitor and assist your assigned patients</p>
        </div>
        <button onClick={fetchData} className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-sm font-semibold">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* SOS Sound & Banner Overlay */}
      {sosAlerts.length > 0 && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-red-500 text-white rounded-2xl p-6 shadow-xl shadow-red-100 flex flex-col md:flex-row items-center justify-between gap-4 border border-red-600 relative overflow-hidden">
          {/* Custom Sound effect inside browser */}
          <audio autoPlay loop src="https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav" className="hidden" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-ping">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold">🚨 EMERGENCY ALERT ACTIVE</h3>
              <p className="text-red-100 text-sm mt-0.5">{sosAlerts.length} unread emergency notification(s). A patient triggered SOS!</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab('notifications')} className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              View Alerts
            </button>
            <button onClick={markAllSOSRead} className="bg-red-600 text-white hover:bg-red-700 border border-red-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              Mute & Clear
            </button>
          </div>
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-400/20 rounded-full" />
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />) : [
          { label: 'Assigned Patients', value: `${patients.length}`, sub: 'Connected accounts', color: 'from-blue-600 to-cyan-500' },
          { label: 'Avg Compliance', value: `${avgAdherence}%`, sub: 'Today\'s adherence rate', color: 'from-emerald-500 to-teal-400' },
          { label: 'Attention Needed', value: `${criticalPatients}`, sub: 'Adherence < 70% or low stock', color: criticalPatients > 0 ? 'from-amber-500 to-orange-400' : 'from-slate-400 to-slate-500' },
          { label: 'Active SOS Alerts', value: `${sosAlerts.length}`, sub: 'Immediate attention', color: sosAlerts.length > 0 ? 'from-red-500 to-red-600 animate-pulse' : 'from-slate-400 to-slate-500' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`bg-gradient-to-br ${s.color} p-5 rounded-2xl text-white shadow-sm`}>
            <div className="text-3xl font-extrabold">{s.value}</div>
            <div className="text-sm font-semibold mt-1">{s.label}</div>
            <div className="text-xs opacity-80 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Patient Monitoring Registry</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <UserCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No patients assigned yet</p>
              <p className="text-sm">Use the "Assign Patient" card on the right to start monitoring.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-all gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        {p.name}
                        {p.adherence < 70 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Risk</span>}
                      </h4>
                      <p className="text-xs text-slate-500">Blood: {p.bloodGroup || 'N/A'} · DOB: {p.dateOfBirth || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Compliance Progress bar */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-slate-500 font-medium">Compliance</span>
                        <span className="font-bold text-slate-700">{p.adherence}%</span>
                      </div>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.adherence}%`, backgroundColor: p.adherence < 70 ? '#ef4444' : '#10b981' }} />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-600">{p.totalMedicines} Scheduled</div>
                      <div className={`text-[10px] ${p.lowStockCount > 0 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                        {p.lowStockCount > 0 ? `⚠️ ${p.lowStockCount} need refill` : 'Stock is OK'}
                      </div>
                    </div>

                    <button onClick={() => setActiveTab(`patient-${p.id}`)} className="p-2 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assign Patient */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Assign New Patient</h2>
            <p className="text-slate-500 text-xs mb-4">Connect a patient account to your caregiver dashboard to monitor their health schedule.</p>

            {assignError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
                {assignError}
              </div>
            )}
            {assignSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-semibold">
                {assignSuccess}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Patient's Registered Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="patient@example.com"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={assignLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {assignLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus size={16} /><span>Assign Patient</span></>}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">Notice:</span> A patient account must be registered with this email first before they can be assigned.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Patient Detail Viewer (with AI insights) ─────────────────────────
const CaregiverPatientDetail = ({ patientId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insights, setInsights] = useState('');

  const fetchPatientDetail = () => {
    setLoading(true);
    api.get(`/caregiver/patient/${patientId}/summary`)
      .then(res => {
        setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatientDetail();
    setInsights('');
  }, [patientId]);

  const generateInsights = async () => {
    setInsightLoading(true);
    setInsights('');
    try {
      const res = await api.get(`/caregiver/insights/${patientId}`);
      setInsights(res.data.insights);
    } catch (err) {
      console.error(err);
      setInsights('Failed to generate insights. Check if Google Gemini key is correctly configured.');
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded-2xl col-span-2" />
          <div className="h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { patient, medicines, notifications } = data;
  const today = new Date().toISOString().split('T')[0];
  const totalMeds = medicines.length;
  const takenToday = medicines.filter(m => m.takenDates?.includes(today)).length;
  const compliance = totalMeds > 0 ? Math.round((takenToday / totalMeds) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-200">
            {patient.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{patient.name}</h2>
            <p className="text-sm text-slate-500">Contact: {patient.phone || 'No phone registered'} · {patient.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 font-bold px-3 py-1 rounded-full text-slate-600 capitalize">Blood: {patient.bloodGroup || 'N/A'}</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${compliance < 70 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            Today: {compliance}% compliance
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Medicines Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medicines scheduled */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Medications and Active Stock</h3>
            {medicines.length === 0 ? (
              <p className="text-slate-400 text-center py-6">No active medications scheduled for this patient.</p>
            ) : (
              <div className="space-y-3">
                {medicines.map(med => {
                  const taken = med.takenDates?.includes(today);
                  return (
                    <div key={med.id} className={`flex items-center justify-between p-4 rounded-xl border ${taken ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: med.color + '20', color: med.color }}>
                          <Pill size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{med.name} <span className="text-xs font-normal text-slate-500">({med.dosage})</span></p>
                          <p className="text-xs text-slate-500">Scheduled: {med.timings.join(', ')} · Frequency: {med.frequency}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${med.stock <= med.refillAt ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          Stock: {med.stock}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${taken ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {taken ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Health Alerts log */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Notification & SOS Activity Logs</h3>
            {notifications.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No recent health activity logs.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                    <div className="mt-0.5">
                      {n.type === 'emergency' ? (
                        <div className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-[10px]">🚨</div>
                      ) : n.type === 'refill' ? (
                        <div className="w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-[10px]">⚠️</div>
                      ) : (
                        <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px]">ℹ️</div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-700">{n.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: AI patient Insights (Powered by Gemini) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-1.5">
            <BookOpen size={20} className="text-teal-600" />
            AI Patient Insights
          </h3>
          <p className="text-slate-500 text-xs mb-4">Use Google Gemini to analyze patient adherence, key safety alerts, and generate a clinical brief.</p>

          <button
            onClick={generateInsights}
            disabled={insightLoading}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 hover:shadow-lg transition-all disabled:opacity-60"
          >
            {insightLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Activity size={16} /><span>Generate AI Analysis</span></>}
          </button>

          <AnimatePresence>
            {insights && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 pt-4 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed max-h-[380px] overflow-y-auto space-y-2 whitespace-pre-wrap select-text">
                  {insights}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── Caregiver Notifications tab ───────────────────────────────────────
const CaregiverNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => setNotifications(res.data.notifications))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all');
    fetchNotifs();
  };

  const handleMarkRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchNotifs();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Alerts & Notifications</h2>
          <p className="text-xs text-slate-500 mt-0.5">Emergency alarms and compliance alerts</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="text-xs font-bold text-blue-600 hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Bell size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">All quiet here</p>
          <p className="text-xs mt-1">No alerts or notifications received.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-start justify-between p-4 rounded-xl border transition-all ${n.isRead ? 'bg-slate-50 border-slate-100' : 'bg-red-50/40 border-red-100'}`}>
              <div className="flex gap-3">
                <div className="mt-0.5">
                  {n.type === 'emergency' ? (
                    <div className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs animate-pulse">🚨</div>
                  ) : n.type === 'refill' ? (
                    <div className="w-7 h-7 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs">⚠️</div>
                  ) : (
                    <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">ℹ️</div>
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-800'}`}>{n.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => handleMarkRead(n.id)} className="text-[10px] font-bold text-red-600 hover:underline uppercase bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Caregiver Settings tab ───────────────────────────────────────────
const CaregiverSettings = () => {
  const { user } = useAuth();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Caregiver Profile Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">{user?.name}</h3>
            <p className="text-xs text-slate-500">Registered Email: {user?.email}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Your Professional Role</label>
            <input type="text" value="Registered Caregiver / Family Monitor" disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Assigned Department</label>
            <input type="text" value="Outpatient Care Management" disabled className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm" />
          </div>
        </div>

        <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-xs text-teal-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Access Level: Caregiver.</span> You are authorized to monitor patient schedules, receive medication stock warnings, and get emergency alerts. You do not have permissions to manage billing, adjust security protocols, or modify central database settings.
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Caregiver Dashboard Router ───────────────────────────────────────
const CaregiverDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Caregiver Hub' },
    { id: 'notifications', icon: Bell, label: 'Alerts Logs' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const renderContent = () => {
    if (activeTab.startsWith('patient-')) {
      const patientId = activeTab.replace('patient-', '');
      return <CaregiverPatientDetail patientId={patientId} />;
    }

    switch (activeTab) {
      case 'dashboard': return <CaregiverHome setActiveTab={setActiveTab} />;
      case 'notifications': return <CaregiverNotifications />;
      case 'settings': return <CaregiverSettings />;
      default: return <CaregiverHome setActiveTab={setActiveTab} />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 text-teal-600 font-extrabold text-xl">
          <ShieldAlert size={26} />
          <span>MediShield AI</span>
        </div>
      </div>

      {/* User */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm truncate">{user?.name}</p>
            <p className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full font-bold w-fit mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeTab === item.id ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
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
            <h2 className="text-lg font-bold text-slate-700">
              {activeTab.startsWith('patient-') ? 'Patient Insights Summary' : navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {activeTab.startsWith('patient-') && (
              <button onClick={() => setActiveTab('dashboard')} className="text-xs font-semibold text-teal-600 hover:underline border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-50 transition-colors">
                ← Back to Registry
              </button>
            )}
            <button onClick={() => { setActiveTab('notifications'); }}
              className="p-2 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-teal-50 transition-colors">
              <Bell size={20} />
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
              className="max-w-6xl mx-auto h-full select-none">
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default CaregiverDashboard;
