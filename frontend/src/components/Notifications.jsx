import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Info, AlertCircle, Pill, RefreshCcw } from 'lucide-react';
import api from '../services/api';

const TYPE_STYLES = {
  reminder: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Pill },
  emergency: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
  system: { bg: 'bg-slate-50', text: 'text-slate-600', icon: Info },
  caregiver: { bg: 'bg-purple-50', text: 'text-purple-600', icon: Bell },
  refill: { bg: 'bg-amber-50', text: 'text-amber-600', icon: RefreshCcw },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
          <p className="text-slate-500 text-sm">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Bell size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => {
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
            const Icon = style.icon;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex gap-4 p-4 rounded-2xl border transition-all ${n.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/60 border-blue-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`font-semibold text-sm ${n.isRead ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-blue-500 hover:text-blue-700 flex-shrink-0 flex items-center gap-1">
                        <Check size={13} /> Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
