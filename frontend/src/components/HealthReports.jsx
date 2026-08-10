import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Printer, CheckCircle, ShieldAlert, Award, Calendar, Activity } from 'lucide-react';
import api from '../services/api';

const HealthReports = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportId] = useState(() => `MS-REP-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    api.get('/medicines')
      .then(res => setMedicines(res.data.medicines))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build adherence data for the past 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      const taken = medicines.filter(m => m.takenDates?.includes(key)).length;
      const total = medicines.length;
      days.push({
        day: dayLabel,
        date: dateLabel,
        taken,
        total,
        adherence: total > 0 ? Math.round((taken / total) * 100) : 0,
        rawDate: key
      });
    }
    return days;
  };

  const adherenceData = getLast7Days();
  const today = new Date().toISOString().split('T')[0];
  const takenToday = medicines.filter(m => m.takenDates?.includes(today)).length;
  const totalMeds = medicines.length;
  const completionPct = totalMeds > 0 ? Math.round((takenToday / totalMeds) * 100) : 0;
  const avgAdherence = adherenceData.length > 0 ? Math.round(adherenceData.reduce((s, d) => s + d.adherence, 0) / adherenceData.length) : 0;
  const healthScore = Math.min(100, 60 + Math.round(avgAdherence * 0.4));

  const pieData = [
    { name: 'Taken', value: takenToday, color: '#10b981' },
    { name: 'Remaining', value: Math.max(0, totalMeds - takenToday), color: '#e2e8f0' },
  ];

  const statCards = [
    { label: "Today's Adherence", value: `${completionPct}%`, sub: `${takenToday}/${totalMeds} medicines taken`, color: 'from-blue-500 to-cyan-400' },
    { label: '7-Day Average', value: `${avgAdherence}%`, sub: 'Weekly adherence rate', color: 'from-emerald-500 to-green-400' },
    { label: 'Active Medicines', value: totalMeds, sub: 'Currently scheduled', color: 'from-violet-500 to-purple-400' },
    { label: 'Health Score', value: `${healthScore}`, sub: 'AI generated score', color: 'from-amber-500 to-orange-400' },
  ];

  return (
    <div className="relative">
      {/* ─── SCREEN ONLY LAYOUT ─── */}
      <div className="print:hidden">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Health Reports & Analytics</h2>
            <p className="text-slate-500 text-sm">Insights about your medicine adherence and health trends</p>
          </div>
          <button
            onClick={() => window.print()}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-100 hover:shadow-blue-200 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <Printer size={16} />
            Download Clinical PDF
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {statCards.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${s.color} p-5 rounded-2xl text-white`}>
                  <div className="text-3xl font-extrabold mb-1">{s.value}</div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs opacity-80 mt-0.5">{s.sub}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Bar Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 mb-4">Weekly Adherence Trend</h3>
                <div className="w-full">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={adherenceData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Adherence']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Bar dataKey="adherence" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Today's Pie */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
                <h3 className="font-bold text-slate-700 mb-4 self-start">Today's Completion</h3>
                <div className="relative flex items-center justify-center">
                  <PieChart width={150} height={150}>
                    <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute text-center">
                    <div className="text-3xl font-extrabold text-slate-800">{completionPct}%</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider">completed</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Medicine list with stock */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 mb-4">Medicine Stock Overview</h3>
                {medicines.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-6">No medicines scheduled. Add medicines to see analytics.</p>
                ) : (
                  <div className="space-y-3">
                    {medicines.map(m => {
                      const pct = Math.min(100, Math.round((m.stock / 30) * 100));
                      return (
                        <div key={m.id} className="flex items-center gap-4">
                          <div className="w-32 text-sm font-medium text-slate-700 truncate">{m.name}</div>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: m.stock <= 5 ? '#ef4444' : m.color || '#2563eb' }} />
                          </div>
                          <span className={`text-xs font-bold w-16 text-right ${m.stock <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>{m.stock} left</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── PRINT ONLY SLEEK CLINICAL PDF REPORT ─── */}
      {!loading && (
        <div className="hidden print:block bg-white text-slate-900 p-10 font-sans w-full min-h-screen">
          {/* Top Medical Cross / Brand */}
          <div className="flex justify-between items-start border-b-4 border-blue-600 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-black text-2xl uppercase tracking-wider">
                <Activity size={28} className="stroke-[3]" />
                <span>MediShield Clinical Care</span>
              </div>
              <p className="text-xs text-slate-500 font-bold tracking-widest mt-1">AI-POWERED EMERGENCY DETECTION & COMPLIANCE SYSTEM</p>
            </div>
            <div className="text-right">
              <div className="bg-slate-100 text-slate-800 text-[10px] font-mono px-3 py-1 rounded-md font-bold tracking-wider inline-block">
                REF: {reportId}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight uppercase">Patient Clinical Adherence Report</h1>
            <p className="text-sm text-slate-500 mt-1">Confidential Medical Tracker Summary</p>
          </div>

          {/* Adherence Highlights Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Avg Compliance', value: `${avgAdherence}%`, desc: '7-Day Adherence Rate', icon: Award },
              { label: 'Clinical Score', value: `${healthScore}/100`, desc: 'Calculated Health Ratio', icon: Activity },
              { label: 'Scheduled Medicines', value: totalMeds, desc: 'Active Prescriptions', icon: Calendar },
              { label: 'Completion Today', value: `${completionPct}%`, desc: 'Medicines Taken Today', icon: CheckCircle }
            ].map((stat, i) => (
              <div key={i} className="border border-slate-200 rounded-xl p-4 text-center bg-slate-50">
                <stat.icon size={20} className="mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{stat.desc}</div>
              </div>
            ))}
          </div>

          {/* Scheduled Meds Detail Table */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">Prescribed Medication Compliance Overview</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase">
                  <th className="py-2">Medication</th>
                  <th className="py-2">Dosage</th>
                  <th className="py-2">Timings</th>
                  <th className="py-2">Current Stock</th>
                  <th className="py-2 text-right">7-Day Log Status</th>
                </tr>
              </thead>
              <tbody>
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-xs text-slate-400">No active medicines logged.</td>
                  </tr>
                ) : (
                  medicines.map(m => {
                    const logsCount = adherenceData.filter(d => m.takenDates?.includes(d.rawDate)).length;
                    const logRate = Math.round((logsCount / 7) * 100);
                    return (
                      <tr key={m.id} className="border-b border-slate-100 text-xs">
                        <td className="py-3 font-bold text-slate-800">{m.name}</td>
                        <td className="py-3 text-slate-600">{m.dosage}</td>
                        <td className="py-3 text-slate-600">{m.timings.join(', ')}</td>
                        <td className="py-3 font-medium text-slate-700">{m.stock} units left</td>
                        <td className="py-3 text-right font-bold text-blue-600">{logRate}% adherence</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Adherence Calendar Matrix */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">Daily Compliance Log</h3>
            <div className="grid grid-cols-7 gap-2">
              {adherenceData.map((day, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-2.5 text-center bg-slate-50">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">{day.day}</div>
                  <div className="text-[10px] text-slate-500">{day.date}</div>
                  <div className={`text-sm font-black mt-1 ${day.adherence >= 80 ? 'text-emerald-600' : day.adherence >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {day.adherence}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caregiver Signoff section */}
          <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-xs">
            <div>
              <div className="w-48 border-b border-slate-400 h-10"></div>
              <p className="mt-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Assigned Caregiver Signature</p>
              <p className="text-[9px] text-slate-400 mt-0.5">MediShield Health Monitoring Hub</p>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-400 h-10 ml-auto"></div>
              <p className="mt-2 text-slate-500 font-bold uppercase tracking-wider text-[10px]">Clinical Supervisor / MD Sign-off</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Date of Review: ____________________</p>
            </div>
          </div>

          {/* Confidentiality Notice */}
          <div className="mt-20 bg-slate-50 border border-slate-100 rounded-xl p-4 text-[10px] leading-relaxed text-slate-500 flex items-start gap-3">
            <ShieldAlert size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-700">CONFIDENTIALITY & DISCLAIMER NOTICE:</span> This clinical report is produced strictly using patient self-reported logs combined with digital medication administration timelines and tracking interfaces. It is a monitoring overview designed for support teams and does not constitute official prescription modifications, diagnostic audits, or professional medical authority. All healthcare adjustments must be explicitly authorized by registered physicians.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthReports;
