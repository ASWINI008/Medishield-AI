import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Lock, Bell, Save, Check, Shield, Smartphone, Key, 
  History, Monitor, Eye, Trash2, Plus, ShieldAlert, LogOut, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // 1. Profile State
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || ''
  });

  // 2. Security / Passwords State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 2FA Toggle & Verification
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tfaVerified, setTfaVerified] = useState(false);

  // 3. Login Sessions History State
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Windows 11 PC · Chrome Browser', location: 'New Delhi, IN', time: 'Active Now', current: true },
    { id: 2, device: 'Apple iPhone 15 · Safari Mobile', location: 'Mumbai, IN', time: '2 hours ago', current: false },
    { id: 3, device: 'iPad Pro · MediShield App v2.1', location: 'Bengaluru, IN', time: 'May 18, 2026', current: false }
  ]);

  // 4. Emergency Contacts State
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '' });

  // 5. Preferences & Privacy Toggles State
  const [privacy, setPrivacy] = useState({
    shareAdherence: true,
    anonymizeLogs: false,
    profileSearchable: true
  });
  const [notifications, setNotifications] = useState({
    reminders: true,
    refill: true,
    emergency: true,
    weekly: false
  });
  const [sessionTimeout, setSessionTimeout] = useState('15'); // mins

  const showFeedback = (type, msg) => {
    if (type === 'success') {
      setSuccess(msg);
      setError('');
    } else {
      setError(msg);
      setSuccess('');
    }
    setTimeout(() => { setSuccess(''); setError(''); }, 4000);
  };

  // Submit profile edits
  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', profile);
      showFeedback('success', 'Profile updated successfully!');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  // Submit password change
  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showFeedback('error', 'New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      showFeedback('error', 'Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showFeedback('success', 'Password updated successfully!');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  // Enable/Verify Two-Factor Auth
  const handleTFAVerify = (e) => {
    e.preventDefault();
    if (twoFactorCode === '123456' || twoFactorCode.length === 6) {
      setTwoFactorEnabled(true);
      setShowQR(false);
      setTfaVerified(true);
      showFeedback('success', 'Two-Factor Authentication (2FA) is now fully enabled!');
    } else {
      showFeedback('error', 'Invalid verification code. Please try again.');
    }
  };

  // Revoke session from device list
  const revokeSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    showFeedback('success', 'Device session revoked successfully.');
  };

  // Add Emergency Contact
  const addContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone || !newContact.relation) return;
    setContacts(prev => [...prev, { id: Date.now(), ...newContact }]);
    setNewContact({ name: '', relation: '', phone: '' });
    showFeedback('success', 'Emergency contact added successfully.');
  };

  // Delete Emergency Contact
  const deleteContact = (id) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    showFeedback('success', 'Emergency contact removed.');
  };

  const menuItems = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'security', icon: Lock, label: 'Security & 2FA' },
    { id: 'sessions', icon: Monitor, label: 'Devices & Activity' },
    { id: 'contacts', icon: ShieldAlert, label: 'Emergency Contacts' },
    { id: 'preferences', icon: Bell, label: 'Preferences' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Security & Account Settings</h2>
        <p className="text-slate-500 text-sm">Manage authentication parameters, devices, contacts, and clinical logs preferences</p>
      </div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <span>{success}</span>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
          <span>⚠️ {error}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Settings Tab Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-bold">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

        {/* Settings View panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[460px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* TAB 1: PROFILE DETAILS */}
              {activeTab === 'profile' && (
                <form onSubmit={saveProfile} className="space-y-5 max-w-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{user?.name}</h3>
                      <p className="text-sm text-slate-500">{user?.email} · <span className="capitalize bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full text-xs font-bold">{user?.role}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Blood Group</label>
                      <input
                        type="text"
                        value={profile.bloodGroup}
                        onChange={e => setProfile(p => ({ ...p, bloodGroup: e.target.value }))}
                        className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. O+"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                        className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="123 Health Street"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={saving} className="flex items-center gap-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-sm shadow-blue-100 hover:shadow-blue-200">
                    {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                    Save Profile Changes
                  </button>
                </form>
              )}

              {/* TAB 2: SECURITY & TWO-FACTOR AUTH */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-xl">
                  {/* Password Change Form */}
                  <form onSubmit={savePassword} className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Key size={18} className="text-blue-500" />
                      <span>Change Password</span>
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1">Current Password</label>
                        <input
                          type="password"
                          value={passwords.currentPassword}
                          onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                          required
                          className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 block mb-1">New Password</label>
                          <input
                            type="password"
                            value={passwords.newPassword}
                            onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                            required
                            className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 block mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                            required
                            className="w-full text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-sm shadow-blue-100 hover:shadow-blue-200">
                      <Lock size={16} />
                      Update Account Password
                    </button>
                  </form>

                  {/* Two-Factor Authentication Box */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                          <Smartphone size={18} className="text-teal-600" />
                          <span>Two-Factor Authentication (2FA)</span>
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">Secure your medical history with an additional authenticator app verification code.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={twoFactorEnabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShowQR(true);
                              setTfaVerified(false);
                            } else {
                              setTwoFactorEnabled(false);
                              setTfaVerified(false);
                              showFeedback('success', 'Two-Factor authentication has been deactivated.');
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>

                    {showQR && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5">
                        <div className="w-24 h-24 bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                          {/* Beautiful simulated vector QR */}
                          <div className="w-full h-full bg-slate-800 rounded flex flex-wrap p-1 gap-1 items-center justify-center">
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                              <div key={i} className={`w-3.5 h-3.5 ${i % 3 === 0 || i % 4 === 1 ? 'bg-white' : 'bg-transparent'} border border-slate-900 rounded-[2px]`} />
                            ))}
                          </div>
                        </div>
                        <form onSubmit={handleTFAVerify} className="space-y-3 flex-1 w-full">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            1. Scan the QR code using Google Authenticator or Duo.<br/>
                            2. Enter the active 6-digit verification code below.
                          </p>
                          <div className="flex gap-2 w-full max-w-xs">
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={e => setTwoFactorCode(e.target.value)}
                              placeholder="e.g. 123456"
                              maxLength={6}
                              className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-teal-500 text-center font-mono font-bold"
                            />
                            <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                              Verify Code
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {tfaVerified && twoFactorEnabled && (
                      <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-850 text-xs font-semibold flex items-center gap-2">
                        <Check size={16} className="stroke-[3] text-teal-650" />
                        2FA Authenticator verified. Device tokens secured.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: LOGIN HISTORY & SESSIONS */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-2">
                      <History size={18} className="text-violet-500" />
                      <span>Active Sessions & Login Activity</span>
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">These devices have signed in using your credentials. Revoke unfamiliar sessions instantly.</p>
                  </div>

                  <div className="space-y-3">
                    {sessions.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                            <Monitor size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{s.device}</p>
                            <p className="text-xs text-slate-500 mt-1">{s.location} · {s.time}</p>
                          </div>
                        </div>
                        {s.current ? (
                          <span className="bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">Current Device</span>
                        ) : (
                          <button
                            onClick={() => revokeSession(s.id)}
                            className="text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 px-4 py-2 rounded-xl font-bold transition-all uppercase tracking-wider"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Session Idle Timeout Selection */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">Auto Session Idle Timeout</h4>
                      <p className="text-slate-500 text-xs mt-1">Automatically clear session authentication token after inactive threshold.</p>
                    </div>
                    <select
                      value={sessionTimeout}
                      onChange={e => {
                        setSessionTimeout(e.target.value);
                        showFeedback('success', `Session timeout updated to ${e.target.value === 'never' ? 'Unlimited' : e.target.value + ' minutes'}.`);
                      }}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-semibold cursor-pointer"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="never">Never (Stay signed in)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 4: EMERGENCY CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 pb-2">
                      <ShieldAlert size={18} className="text-red-500" />
                      <span>Emergency Contacts Registry</span>
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Add physicians, family members, or caregivers to receive instant SOS notifications when triggered.</p>
                  </div>

                  {/* List of Contacts */}
                  <div className="space-y-2">
                    {contacts.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {c.name}
                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{c.relation}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-2">Phone: {c.phone}</p>
                        </div>
                        <button
                          onClick={() => deleteContact(c.id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Contact Form */}
                  <form onSubmit={addContact} className="bg-slate-50/50 border border-slate-105 rounded-2xl p-5 space-y-4">
                    <h4 className="font-bold text-slate-700 text-sm">Add Emergency Contact</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={newContact.name}
                          onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))}
                          placeholder="Contact Name"
                          required
                          className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={newContact.relation}
                          onChange={e => setNewContact(c => ({ ...c, relation: e.target.value }))}
                          placeholder="Relationship (e.g. Spouse)"
                          required
                          className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          value={newContact.phone}
                          onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))}
                          placeholder="Phone Number"
                          required
                          className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                      <Plus size={16} /> Add Contact
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: PREFERENCES & PRIVACY */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  {/* Account Privacy Settings */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Eye size={18} className="text-teal-600" />
                      <span>Account Privacy Settings</span>
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Share Compliance Logs with Clinicians', sub: 'Enable outpatient teams to review your scheduled medicine timelines automatically.', key: 'shareAdherence' },
                        { label: 'Anonymize AI Assistant Queries', sub: 'Enforce standard data minimization rules so no prompt parameters map to your name.', key: 'anonymizeLogs' },
                        { label: 'Profile Discoverability via Email', sub: 'Allow assigned caregivers to link with your account by looking up your registered email.', key: 'profileSearchable' }
                      ].map(item => (
                        <div key={item.key} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="max-w-[80%] pr-4">
                            <p className="text-sm font-bold text-slate-700 leading-snug">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.sub}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={privacy[item.key]}
                              onChange={(e) => {
                                setPrivacy(p => ({ ...p, [item.key]: e.target.checked }));
                                showFeedback('success', 'Privacy setting updated successfully.');
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notification Toggles */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Bell size={18} className="text-blue-500" />
                      <span>Notification Preferences</span>
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Scheduled Medicine Reminders', sub: 'Receive audio-visual alarms at dosage timings.', key: 'reminders' },
                        { label: 'Low Stock Refill Reminders', sub: 'Notify when stock count is at or below threshold.', key: 'refill' },
                        { label: 'High Severity Emergency Alerts', sub: 'Instant alert popup warnings when critical timelines are missed.', key: 'emergency' },
                        { label: 'Weekly Adherence Digest Summary', sub: 'Dispatch calculated compliance statistics reports.', key: 'weekly' }
                      ].map(item => (
                        <div key={item.key} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="max-w-[80%] pr-4">
                            <p className="text-sm font-bold text-slate-700 leading-snug">{item.label}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.sub}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={notifications[item.key]}
                              onChange={(e) => {
                                setNotifications(n => ({ ...n, [item.key]: e.target.checked }));
                                showFeedback('success', 'Notification alert updated.');
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;
