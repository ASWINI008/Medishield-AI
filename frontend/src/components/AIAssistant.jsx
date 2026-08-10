import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Trash2, User, Mic, MicOff, Sparkles, AlertTriangle, ShieldAlert, Check, Activity } from 'lucide-react';
import api from '../services/api';

const TRANSLATIONS = {
  english: {
    title: "Hi! I'm your Health Assistant",
    desc: "Ask me anything about your medicines, health tips, or wellness advice.",
    placeholder: "Ask about your health or medicines...",
    suggestions: [
      "Can I take medicine after food?",
      "What if I miss a dose?",
      "Show me my medicine schedule",
      "What is the best time to take vitamins?",
    ]
  },
  tamil: {
    title: "வணக்கம்! நான் உங்கள் மருத்துவ உதவியாளர்",
    desc: "உங்கள் மருந்துகள், சுகாதார குறிப்புகள் அல்லது ஆரோக்கிய ஆலோசனைகள் பற்றி ஏதேனும் கேளுங்கள்.",
    placeholder: "உங்கள் ஆரோக்கியம் அல்லது மருந்துகள் பற்றி கேளுங்கள்...",
    suggestions: [
      "உணவுக்குப் பின் மருந்து உட்கொள்ளலாமா?",
      "மருந்து அளவைத் தவறவிட்டால் என்ன செய்வது?",
      "எனது மருந்து அட்டவணையைக் காட்டு",
      "வைட்டமின்கள் எடுக்க சிறந்த நேரம் எது?",
    ]
  },
  hindi: {
    title: "नमस्ते! मैं आपका स्वास्थ्य सहायक हूँ",
    desc: "अपनी दवाओं, स्वास्थ्य युक्तियों या कल्याण सलाह के बारे में कुछ भी पूछें।",
    placeholder: "अपनी स्वास्थ्य या दवाओं के बारे में पूछें...",
    suggestions: [
      "क्या मैं भोजन के बाद दवा ले सकता हूँ?",
      "यदि खुराक छूट जाए तो क्या करें?",
      "मुझे मेरी दवा की समय सारणी दिखाएं",
      "विटामिन लेने का सबसे अच्छा समय क्या है?",
    ]
  }
};

const SYMPTOMS_LIST = [
  "Fever", "Headache", "Cough", "Fatigue", "Dizziness", "Nausea", "Shortness of Breath", "Muscle Aches", "Sore Throat", "Chest Pain"
];

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Multilingual state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('medishield_chat_lang') || 'english';
  });

  // Symptom Checker State
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptomText, setCustomSymptomText] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  useEffect(() => {
    api.get('/ai/history')
      .then(res => setMessages(res.data.messages || []))
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('medishield_chat_lang', newLang);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg, timestamp: new Date() }]);
    setLoading(true);

    // Detect language
    let activeLang = language;
    if (/[\u0B80-\u0BFF]/.test(msg)) {
      activeLang = 'tamil';
    } else if (/[\u0900-\u097F]/.test(msg)) {
      activeLang = 'hindi';
    } else if (/[a-zA-Z]/.test(msg)) {
      activeLang = 'english';
    }

    if (activeLang !== language) {
      setLanguage(activeLang);
      localStorage.setItem('medishield_chat_lang', activeLang);
    }

    try {
      const res = await api.post('/ai/chat', { message: msg, language: activeLang });
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply, timestamp: new Date() }]);

      if (res.data.language && res.data.language !== activeLang) {
        setLanguage(res.data.language);
        localStorage.setItem('medishield_chat_lang', res.data.language);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to get response. Please check your Gemini API key.';
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${errMsg}`, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Clear all chat history?')) return;
    await api.delete('/ai/history');
    setMessages([]);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Dynamically set recognition language
    if (language === 'tamil') {
      recognition.lang = 'ta-IN';
    } else if (language === 'hindi') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-US';
    }

    recognition.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSymptomSubmit = () => {
    if (selectedSymptoms.length === 0 && !customSymptomText.trim()) {
      alert('Please select at least one symptom or enter observations.');
      return;
    }
    if (!disclaimerAccepted) {
      alert('Please read and accept the medical liability disclaimer.');
      return;
    }

    const symptomsText = selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'None selected';
    const notesText = customSymptomText.trim() ? `\nAdditional Observations: ${customSymptomText.trim()}` : '';
    const query = `[Symptom Check Request]
The patient reports the following symptoms: ${symptomsText}.${notesText}
Please perform a clinical analysis. Note potential causes, suggested primary care interventions, and critical red flags to look out for. Always begin your response with a clear medical disclaimer.`;

    sendMessage(query);
    // Reset state
    setSelectedSymptoms([]);
    setCustomSymptomText('');
    setDisclaimerAccepted(false);
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Health Assistant</h2>
          <p className="text-slate-500 text-sm flex items-center gap-1">
            <Sparkles size={14} className="text-blue-500" /> Powered by Google Gemini
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Switch Dropdown */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm px-3 py-1.5 pr-8 rounded-xl hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-medium"
            >
              <option value="english">English</option>
              <option value="tamil">தமிழ் (Tamil)</option>
              <option value="hindi">हिंदी (Hindi)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
          <button onClick={clearHistory} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1.5 rounded-xl hover:border-red-200 transition-colors">
            <Trash2 size={15} /> Clear History
          </button>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
        {/* Chat Window (Left / Center) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {historyLoading ? (
              <div className="flex justify-center pt-10">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Bot size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">
                  {TRANSLATIONS[language]?.title || TRANSLATIONS.english.title}
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs font-normal">
                  {TRANSLATIONS[language]?.desc || TRANSLATIONS.english.desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {(TRANSLATIONS[language]?.suggestions || TRANSLATIONS.english.suggestions).map(s => (
                    <button key={s} onClick={() => sendMessage(s)} className="text-left text-sm px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'}`}>
                      <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                      <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={16} className="text-slate-600" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1 items-center h-5">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-2 h-2 bg-slate-400 rounded-full"
                            animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input Panel */}
          <div className="border-t border-slate-100 p-4 flex-shrink-0">
            <div className="flex gap-2">
              <button onClick={toggleVoice} className={`p-2.5 rounded-xl border transition-colors ${listening ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200'}`}>
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={TRANSLATIONS[language]?.placeholder || TRANSLATIONS.english.placeholder}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* AI Symptom Checker Widget (Right Column) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full min-h-0 overflow-y-auto space-y-4">
          <div className="flex items-center gap-2 text-teal-600">
            <Activity size={22} className="stroke-[2.5]" />
            <h3 className="font-extrabold text-slate-800 text-lg">AI Symptom Checker</h3>
          </div>
          <p className="text-slate-500 text-xs">
            Select what you are feeling to trigger a detailed diagnostic scan from our AI engine.
          </p>

          {/* Symptom Selectors */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Symptoms</label>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS_LIST.map(s => {
                const active = selectedSymptoms.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`text-xs px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                      active
                        ? 'bg-teal-50 border-teal-200 text-teal-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                    {active && <Check size={12} className="stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Description Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Describe feelings</label>
            <textarea
              value={customSymptomText}
              onChange={e => setCustomSymptomText(e.target.value)}
              placeholder="e.g. Started yesterday, feels worse when bending over..."
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Medical Liability Disclaimer Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] leading-relaxed text-amber-800">
            <div className="flex items-center gap-1.5 mb-1 font-bold text-amber-900">
              <ShieldAlert size={14} className="text-amber-600 flex-shrink-0" />
              <span>Medical Disclaimer</span>
            </div>
            MediShield AI symptom scans are purely informational and designed for educational guidance. They are not checked by clinicians and must NOT replace formal medical diagnosis, prescriptions, or emergency intervention. If your situation is severe, trigger the SOS alarm or call 112 immediately.
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={e => setDisclaimerAccepted(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="leading-snug select-none">
              I read and accept this medical disclaimer, and verify I am not in immediate danger.
            </span>
          </label>

          {/* Submit Action */}
          <button
            onClick={handleSymptomSubmit}
            disabled={loading || (selectedSymptoms.length === 0 && !customSymptomText.trim())}
            className="w-full mt-auto py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-100 hover:shadow-teal-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} />
            Analyze My Symptoms
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
