import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, Siren, Heart, AlertTriangle, Mic, MicOff, Volume2, X } from 'lucide-react';
import api from '../services/api';

const EmergencyAlerts = () => {
  const [sosSent, setSosSent] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Voice activation states
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const isCountingDownRef = useRef(false);
  const voiceEnabledRef = useRef(false);
  const sendingRef = useRef(false);
  const sosSentRef = useRef(false);

  // Sync refs to event listeners
  useEffect(() => { isCountingDownRef.current = isCountingDown; }, [isCountingDown]);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);
  useEffect(() => { sendingRef.current = sending; }, [sending]);
  useEffect(() => { sosSentRef.current = sosSent; }, [sosSent]);

  // Audio Context Synthesizer for beeps and alarms
  const playBeepSound = (frequency = 440, duration = 0.1) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  };

  const playSirenSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      let time = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 660, time);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.4);
        time += 0.4;
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (isCountingDown) {
      playBeepSound(800, 0.15);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsCountingDown(false);
            handleSOS();
            return 5;
          }
          playBeepSound(800, 0.15);
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(5);
    }
    return () => clearInterval(timer);
  }, [isCountingDown]);

  // Speech Recognition effect
  useEffect(() => {
    if (!voiceEnabled) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onend = () => {
      if (voiceEnabledRef.current) {
        try {
          recognition.start();
        } catch (err) {
          // Ignore restart conflicts
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please enable microphone permissions in your browser to use Voice SOS.');
        setVoiceEnabled(false);
      }
    };

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const resultText = event.results[current][0].transcript.trim().toLowerCase();
      setTranscript(resultText);

      const emergencyKeywords = ['emergency', 'help me', 'need help', 'sos', 'call doctor', 'pain'];
      const cancelKeywords = ['cancel', 'stop', 'abort', 'don\'t send'];

      if (isCountingDownRef.current) {
        if (cancelKeywords.some(keyword => resultText.includes(keyword))) {
          handleCancelSOS();
        }
      } else {
        if (emergencyKeywords.some(keyword => resultText.includes(keyword))) {
          triggerCountdown();
        }
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
    }

    return () => {
      recognition.abort();
    };
  }, [voiceEnabled]);

  const triggerCountdown = () => {
    if (sendingRef.current || sosSentRef.current || isCountingDownRef.current) return;
    setIsCountingDown(true);
    setCountdown(5);
    playBeepSound(600, 0.2);
  };

  const handleCancelSOS = () => {
    setIsCountingDown(false);
    setCountdown(5);
    playBeepSound(400, 0.1);
  };

  const handleSOS = async () => {
    setSending(true);
    try {
      await api.post('/emergency/sos');
      setSosSent(true);
      playSirenSound();
      const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA');
      audio.play().catch(() => {});
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
      alert('Failed to send SOS. Please call emergency services directly.');
    } finally {
      setSending(false);
      setTimeout(() => setSosSent(false), 5000);
    }
  };



  const alertTypes = [
    { icon: Heart, label: 'Cardiac Emergency', severity: 'critical', desc: 'Chest pain, irregular heartbeat' },
    { icon: AlertTriangle, label: 'Missed Critical Meds', severity: 'high', desc: 'High-priority medication missed' },
    { icon: Siren, label: 'Fall Detection', severity: 'medium', desc: 'Possible fall or injury' },
  ];

  const severityStyle = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-amber-100 text-amber-700 border-amber-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return (
    <div className="relative">
      {/* Flashing Full-Screen Countdown Overlay */}
      <AnimatePresence>
        {isCountingDown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-50 flex flex-col items-center justify-center text-white px-4 text-center overflow-hidden"
          >
            {/* Pulsing warning backdrop rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute border-[6px] border-white rounded-full animate-ping"
                  style={{
                    width: `${i * 250}px`,
                    height: `${i * 250}px`,
                    animationDuration: '1.5s',
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="relative z-10 flex flex-col items-center"
            >
              <ShieldAlert size={80} className="text-white mb-6" />
              <h1 className="text-3xl sm:text-5xl font-black tracking-wider mb-2">🚨 EMERGENCY SOS ACTIVATED 🚨</h1>
              <p className="text-lg sm:text-xl text-red-100 max-w-md mx-auto mb-8 font-medium">
                Sending alert to caregivers and emergency services in...
              </p>
              
              <motion.span 
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-9xl sm:text-[12rem] font-black leading-none text-white drop-shadow-lg mb-10"
              >
                {countdown}
              </motion.span>

              <button
                onClick={handleCancelSOS}
                className="px-8 py-4 bg-white text-red-600 font-extrabold text-xl rounded-full shadow-2xl hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-3 relative z-20 cursor-pointer"
              >
                <X size={24} /> CANCEL SOS ALERT
              </button>

              <p className="text-sm text-red-200 mt-4 font-semibold italic">
                Or speak: "Cancel" or "Stop" to abort
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Emergency Alerts</h2>
        <p className="text-slate-500 text-sm">SOS alerts and emergency contact information</p>
      </div>

      {/* SOS Button Card */}
      <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-8 text-white text-center mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[1,2,3].map(i => <div key={i} className="absolute inset-0 border-4 border-white rounded-full animate-ping" style={{ animationDelay: `${i * 0.5}s` }} />)}
        </div>
        <ShieldAlert size={40} className="mx-auto mb-4 relative z-10" />
        <h3 className="text-2xl font-bold mb-2 relative z-10">Emergency SOS</h3>
        <p className="text-red-200 text-sm mb-6 relative z-10">Press the button below to send an emergency alert to your caregiver and emergency contacts</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={triggerCountdown}
          disabled={sending || sosSent}
          className={`relative z-10 px-10 py-4 rounded-full text-xl font-extrabold shadow-lg transition-all ${sosSent ? 'bg-green-500' : 'bg-white text-red-600 hover:shadow-white/30'} disabled:opacity-80`}
        >
          {sending ? 'Sending...' : sosSent ? '✓ SOS Sent!' : '🆘 SEND SOS ALERT'}
        </motion.button>
      </div>

      {/* Voice SOS hands-free monitoring control panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${voiceEnabled ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
              {voiceEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                Hands-Free Voice SOS Activation
                {!voiceSupported && <span className="text-xs font-normal text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">Unsupported</span>}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor ambient sound for critical triggers when you can't reach the screen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => voiceSupported && setVoiceEnabled(!voiceEnabled)}
              disabled={!voiceSupported}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${voiceEnabled ? 'bg-green-500' : 'bg-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="sr-only">Enable Voice SOS</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${voiceEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {voiceSupported && voiceEnabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-5 pt-5 border-t border-slate-100 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trigger words:</span>
              {['emergency', 'help me', 'need help', 'sos', 'call doctor'].map((kw) => (
                <span key={kw} className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-medium border border-red-100">
                  "{kw}"
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancel words:</span>
              {['cancel', 'stop', 'abort'].map((kw) => (
                <span key={kw} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium border border-slate-200">
                  "{kw}"
                </span>
              ))}
            </div>

            {transcript && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-2">
                <Volume2 size={16} className="text-slate-400 animate-bounce" />
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-400">Microphone heard:</span> "{transcript}"
                </p>
              </div>
            )}
            
            <p className="text-xs text-green-600 flex items-center gap-1.5 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
              Microphone is live. Say "emergency" or "help me" to test.
            </p>
          </motion.div>
        )}
      </div>

      {/* Alert Types */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> Alert Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertTypes.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${severityStyle[a.severity]}`}>
              <a.icon size={20} />
              <div>
                <p className="font-semibold text-sm">{a.label}</p>
                <p className="text-xs opacity-80">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlerts;

