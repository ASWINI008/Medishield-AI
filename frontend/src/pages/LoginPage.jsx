import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, User, ShieldPlus, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl mb-8">
            <ShieldPlus size={28} />
            <span>MediShield AI</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 mb-8 text-sm">{isLogin ? 'Sign in to your healthcare dashboard' : 'Join MediShield AI to stay healthy'}</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="name" type="text" value={form.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="John Doe" />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} required className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">I am a...</label>
                <select name="role" value={form.role} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="patient">Patient</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>{isLogin ? 'Sign In' : 'Create Account'}</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-600 font-bold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

        {/* Right: Decorative */}
        <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-500 p-12 items-center justify-center relative overflow-hidden">
          <div className="relative z-10 text-white text-center space-y-4">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-6">
              <ShieldPlus size={40} />
            </div>
            <h3 className="text-3xl font-bold">Secure. Smart. Shielded.</h3>
            <p className="text-blue-100 text-sm leading-relaxed">Military-grade encryption keeps your health data completely private and secure.</p>
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[['99.9%', 'Uptime'], ['256-bit', 'Encryption'], ['HIPAA', 'Compliant']].map(([val, label]) => (
                <div key={label} className="bg-white/10 rounded-2xl p-3">
                  <div className="text-xl font-bold">{val}</div>
                  <div className="text-xs text-blue-200">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -top-16 -right-16 w-64 h-64 border-[40px] border-white/10 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 border-[40px] border-white/10 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
