import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, BrainCircuit, X, Send, Bot, User, Sparkles, Mic, MicOff, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const TRANSLATIONS = {
  english: {
    title: "Welcome to the AI Assistant Sandbox!",
    desc: "Ask questions about general wellness, medication schedules, or missed dose instructions.",
    placeholder: "Type your wellness question...",
    suggestions: [
      "Can I take vitamins on an empty stomach?",
      "What should I do if I miss a blood pressure dose?",
      "How does MediShield AI help protect my health?"
    ]
  },
  tamil: {
    title: "AI உதவி சாண்ட்பாக்ஸிற்கு வரவேற்கிறோம்!",
    desc: "பொதுவான ஆரோக்கியம், மருந்து அட்டவணைகள் அல்லது தவறிய டோஸ் வழிமுறைகள் பற்றி கேள்விகளை கேளுங்கள்.",
    placeholder: "உங்கள் ஆரோக்கிய கேள்வியை தட்டச்சு செய்யவும்...",
    suggestions: [
      "வெறும் வயிற்றில் வைட்டமின்கள் எடுக்கலாமா?",
      "இரத்த அழுத்த டோஸை தவறவிட்டால் நான் என்ன செய்ய வேண்டும்?",
      "MediShield AI எனது ஆரோக்கியத்தைப் பாதுகாக்க எவ்வாறு உதவுகிறது?"
    ]
  },
  hindi: {
    title: "एआई सहायक सैंडबॉक्स में आपका स्वागत है!",
    desc: "सामान्य कल्याण, दवा की समय सारणी, या छूटी हुई खुराक के निर्देशों के बारे में प्रश्न पूछें।",
    placeholder: "अपना कल्याण प्रश्न टाइप करें...",
    suggestions: [
      "क्या मैं खाली पेट विटामिन ले सकता हूँ?",
      "यदि मेरी रक्तचाप की खुराक छूट जाए तो मुझे क्या करना चाहिए?",
      "MediShield AI मेरे स्वास्थ्य की रक्षा करने में कैसे मदद करता है?"
    ]
  }
};

const LandingPage = () => {
  const [showAIChat, setShowAIChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Multilingual state
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('medishield_chat_lang') || 'english';
  });

  useEffect(() => {
    if (showAIChat) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, showAIChat]);

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/ai/public-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages, language: activeLang }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'model', text: data.reply, timestamp: new Date() }]);

        if (data.language && data.language !== activeLang) {
          setLanguage(data.language);
          localStorage.setItem('medishield_chat_lang', data.language);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${data.message || 'Error communicating with AI'}`, timestamp: new Date() }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: '⚠️ Unable to connect to the server. Please ensure the backend is running.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
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

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-7xl px-6 py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
              Smart Healthcare Protection <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">
                Powered by AI
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-600">
              Monitor medicines, protect patient health, receive intelligent assistance, and secure healthcare data with MediShield AI.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-4"
          >
            <Link to="/login">
              <button className="bg-gradient-to-r from-blue-600 to-sky-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-blue-400/40 transition-all hover:-translate-y-1">
                Get Started
              </button>
            </Link>
            <button onClick={() => setShowAIChat(true)} className="glass px-8 py-3 rounded-full font-bold text-lg text-slate-700 hover:bg-white/80 transition-all">
              Try AI Assistant
            </button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex-1 w-full relative"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -z-10"></div>
          
          {/* Main Floating Card */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="glass p-8 rounded-3xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <BrainCircuit size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">AI Health Status</h3>
                <p className="text-sm text-emerald-500 font-medium">All systems optimal</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[85%]"></div>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Medicine Adherence</span>
                <span className="text-blue-600">85%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="w-full bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">Enterprise Healthcare Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: 'Real-time Monitoring', desc: 'Track health metrics and medicine adherence continuously.' },
              { icon: BrainCircuit, title: 'AI Assistant', desc: 'Get intelligent health suggestions powered by Gemini AI.' },
              { icon: ShieldCheck, title: 'Cybersecurity', desc: 'Military-grade encryption and secure access controls.' },
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="glass p-8 rounded-3xl text-left border border-slate-100 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                  <feat.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-slate-600">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Security Section */}
      <section id="security" className="w-full bg-slate-900 text-white py-24 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 -z-10"></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
                Secure by Default. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  Protected by Design.
                </span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                We employ industry-leading protocols to protect sensitive healthcare data, ensuring absolute confidentiality and compliance.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                title: "End-to-End Encryption",
                desc: "All medical records, logs, and sensitive data are encrypted at rest and in transit using advanced AES-256 standards.",
                tag: "AES-256"
              },
              {
                title: "Role-Based Access Control",
                desc: "Strict access control policies ensure only verified patients, assigned caregivers, and authorized admins can access health logs.",
                tag: "RBAC Guards"
              },
              {
                title: "Regulatory Compliance",
                desc: "Designed to satisfy HIPAA and GDPR standards, maintaining patient privacy as the ultimate architectural priority.",
                tag: "HIPAA Ready"
              },
              {
                title: "Intrusion Prevention",
                desc: "Equipped with automated rate-limiting, secure headers (Helmet), and query protection to mitigate potential cyber threats.",
                tag: "24/7 Shield"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider inline-block mb-4">
                    {item.tag}
                  </span>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sliding AI Assistant Drawer */}
      <AnimatePresence>
        {showAIChat && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIChat(false)}
              className="fixed inset-0 bg-slate-950 z-50"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white z-50 shadow-2xl flex flex-col h-full border-l border-slate-100"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-sky-500 text-white">
                <div className="flex items-center gap-2">
                  <Bot size={24} />
                  <div>
                    <h3 className="font-bold text-lg leading-tight">MediShield AI Demo</h3>
                    <p className="text-xs text-blue-100 font-medium">Try our intelligent wellness companion</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Language Switch Dropdown */}
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="appearance-none bg-white/15 border border-white/20 text-white text-xs px-2.5 py-1.5 pr-7 rounded-xl hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white transition-all cursor-pointer font-semibold"
                    >
                      <option value="english" className="text-slate-800 font-medium">English</option>
                      <option value="tamil" className="text-slate-800 font-medium">தமிழ் (Tamil)</option>
                      <option value="hindi" className="text-slate-800 font-medium">हिंदी (Hindi)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/80">
                      <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAIChat(false)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-all text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <Sparkles size={32} className="animate-pulse" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">
                      {TRANSLATIONS[language]?.title || TRANSLATIONS.english.title}
                    </h4>
                    <p className="text-slate-500 text-xs max-w-xs mb-6 font-normal">
                      {TRANSLATIONS[language]?.desc || TRANSLATIONS.english.desc}
                    </p>
                    <div className="space-y-2 w-full max-w-sm">
                      {(TRANSLATIONS[language]?.suggestions || TRANSLATIONS.english.suggestions).map(s => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="w-full text-left text-xs px-4 py-3 bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-100 text-slate-700 rounded-xl transition-all shadow-sm font-medium"
                        >
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
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot size={16} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/10' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>
                          <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                          <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
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
                        <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                          <div className="flex gap-1 items-center h-4">
                            {[0, 1, 2].map(i => (
                              <motion.div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              {/* Sandbox Alert Disclaimer */}
              <div className="bg-amber-50 border-t border-b border-amber-200/50 p-4 text-[10px] leading-relaxed text-amber-800 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 block mb-0.5">Public Demo Sandbox</span>
                  Answers are simulated/generic. To integrate with your custom health reports, daily medicine schedules, caregiver sync, and smart alerts, please sign up or log in.
                </div>
              </div>

              {/* Input Panel */}
              <div className="border-t border-slate-100 p-4 bg-white flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={toggleVoice}
                    className={`p-2.5 rounded-xl border transition-all ${listening ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                  >
                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={TRANSLATIONS[language]?.placeholder || TRANSLATIONS.english.placeholder}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none shadow-md shadow-blue-500/10 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="mt-3 text-center">
                  <Link to="/login" onClick={() => setShowAIChat(false)} className="text-xs text-blue-600 font-bold hover:underline">
                    Create a free account to unlock full features &rarr;
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
