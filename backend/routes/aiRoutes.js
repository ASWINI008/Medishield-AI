import { GoogleGenerativeAI } from '@google/generative-ai';
import ChatHistory from '../models/ChatHistory.js';

const SYSTEM_PROMPTS = {
  english: `You are Medishield AI, a professional healthcare assistant chatbot.

Rules:
* Reply ONLY in English.
* Keep responses simple, short, and patient-friendly.
* Help users with:
  * medicine reminders
  * medicine schedules
  * missed medicine guidance
  * health suggestions
  * emergency guidance
* Maintain a caring and professional tone.
* Avoid complicated medical terminology.`,

  tamil: `நீங்கள் Medishield AI என்ற மருத்துவ உதவியாளர் chatbot.

விதிமுறைகள்:
* பதில்களை தமிழில் மட்டும் வழங்கவும்.
* எளிமையான தமிழில் பதிலளிக்கவும்.
* பயனாளர்களுக்கு:
  * மருந்து நினைவூட்டல்
  * தவறிய மருந்து ஆலோசனை
  * உடல்நல வழிகாட்டல்
  * மருந்து அட்டவணை
  * அவசர உதவி
    போன்றவற்றில் உதவவும்.
* அன்பான மற்றும் professional tone பயன்படுத்தவும்.
* கடினமான மருத்துவ வார்த்தைகளை தவிர்க்கவும்.`,

  hindi: `आप Medishield AI नामक हेल्थकेयर असिस्टेंट चैटबॉट हैं।

नियम:
* केवल हिंदी में उत्तर दें।
* उत्तर सरल और मरीजों के लिए समझने योग्य होने चाहिए।
* उपयोगकर्ताओं की मदद करें:
  * दवा रिमाइंडर
  * छूटी हुई दवा मार्गदर्शन
  * स्वास्थ्य सुझाव
  * दवा समय सारणी
  * इमरजेंसी सहायता
* हमेशा प्रोफेशनल और सहायक टोन रखें.`
};

export const detectLanguage = (text) => {
  if (!text) return 'english';
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'tamil';
  }
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }
  if (/[a-zA-Z]/.test(text)) {
    return 'english';
  }
  return null;
};

// Robust Helper to communicate with Google Gemini with timeout, retries, and fallbacks
export const callGeminiWithRetry = async (apiKey, message, systemInstruction, historyMessages = [], retryCount = 1) => {
  // 1. API Key Basic Validation
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.startsWith('AIzaSy')) {
    throw new Error('Invalid API key.');
  }

  // 2. Try models in order of preference (modern active models at front)
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-1.5-pro'
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    let attempts = 0;
    while (attempts <= retryCount) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
        });

        // Map past history to correct format
        const formattedHistory = historyMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text || '' }]
        }));

        const chatSession = model.startChat({ history: formattedHistory });

        // Implement a timeout of 10 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );

        const apiPromise = chatSession.sendMessage(message);

        // Race the API call against the timeout
        const result = await Promise.race([apiPromise, timeoutPromise]);
        const responseText = result.response.text();

        if (responseText) {
          return responseText;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Try] Model ${modelName} (attempt ${attempts + 1}) failed:`, err.message);

        // If it's a specific auth/key error, don't bother retrying or switching models
        if (err.message.includes('API key') || err.message.includes('key is invalid') || err.message.includes('403')) {
          throw new Error('Invalid API key.');
        }

        // If the model is deprecated, not found, or not supported, skip retries and skip to the next model immediately
        if (
          err.message.includes('not found') || 
          err.message.includes('404') || 
          err.message.includes('not supported') || 
          err.message.includes('deprecated')
        ) {
          console.warn(`[Gemini Try] Model ${modelName} is not available/supported. Skipping...`);
          break;
        }

        // Wait a bit before retry (exponential backoff)
        attempts++;
        if (attempts <= retryCount) {
          await new Promise(res => setTimeout(res, 1000 * attempts));
        }
      }
    }
  }

  // If we reach here, all models and retries failed
  if (lastError && lastError.message === 'Timeout') {
    throw new Error('Gemini service connection timeout.');
  }
  if (lastError && (lastError.message.includes('not found') || lastError.message.includes('404'))) {
    throw new Error('Model not supported.');
  }
  
  throw new Error('Gemini service temporarily unavailable due to high demand. Please try again in a few moments.');
};

// POST /api/ai/chat
export const chat = async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini API key not configured. Please add GEMINI_API_KEY to backend/.env' 
      });
    }

    // Determine final language
    const detectedLang = detectLanguage(message);
    const finalLanguage = detectedLang || language || 'english';
    const systemPrompt = SYSTEM_PROMPTS[finalLanguage] || SYSTEM_PROMPTS.english;

    // Load history
    let historyDoc = await ChatHistory.findOne({ where: { userId: req.user.id } });
    const allMessages = historyDoc ? (historyDoc.messages || []) : [];
    const recentMessages = allMessages.slice(-10);

    // Call the robust Gemini runner
    let aiReply;
    try {
      aiReply = await callGeminiWithRetry(apiKey, message, systemPrompt, recentMessages);
    } catch (apiErr) {
      console.error('[Gemini Error Handler]:', apiErr.message);
      return res.status(apiErr.message === 'Invalid API key.' ? 401 : 503).json({ 
        success: false, 
        message: apiErr.message 
      });
    }

    // Persist history if successful
    allMessages.push({ role: 'user', text: message, timestamp: new Date() });
    allMessages.push({ role: 'model', text: aiReply, timestamp: new Date() });
    const trimmed = allMessages.slice(-50);

    if (historyDoc) {
      await historyDoc.update({ messages: trimmed });
    } else {
      await ChatHistory.create({ userId: req.user.id, messages: trimmed });
    }

    res.json({ success: true, reply: aiReply, language: finalLanguage });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// POST /api/ai/scan
export const scanPrescription = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini API key not configured.' 
      });
    }

    const systemInstruction = `You are a medical prescription parser.
Your absolute only task is to extract medical drugs from raw noisy OCR text and output structured JSON.
Look closely for partial matches, abbreviations, and common typos/OCR errors in raw text.
For example:
- "OME09" or "ome09" or similar refers to "Omeprazole"
- "amoxcillin" or "amox" refers to "Amoxicillin"
- "paracet" refers to "Paracetamol"
- "lipitor" refers to "Atorvastatin (Lipitor)"
- "metformin" or "metform" refers to "Metformin"
- "jz" or "JZ" is noise.
- "n" is noise.

You MUST try your best to map highly noisy texts (like "OME09.n.JZ" or similar) to their corresponding real medical drugs. In this case, "OME09" maps to "Omeprazole".
Even if the text is short or extremely garbled, try to identify at least one medicine if it has characters resembling drug names.

You MUST return ONLY a valid JSON array of objects. Do NOT include markdown code blocks, do NOT write any explanation, do NOT include medical advice or reminders. ONLY the raw JSON array.
Each object in the array MUST have the following structure:
{
  "name": "Corrected Medication Name",
  "dosage": "dosage (e.g., '20mg', '500mg'. If not specified in the raw text, provide a standard dosage for this drug)",
  "timings": ["08:00"],
  "instructions": "instructions (e.g. 'Take after food' or 'Take on an empty stomach' or 'As directed')"
}
If absolutely no drugs can be identified or inferred, return an empty array: []`;

    let aiReply;
    try {
      aiReply = await callGeminiWithRetry(apiKey, `Extract from: "${text}"`, systemInstruction, []);
    } catch (apiErr) {
      console.error('[Gemini Scan Error]:', apiErr.message);
      return res.status(apiErr.message === 'Invalid API key.' ? 401 : 503).json({ 
        success: false, 
        message: apiErr.message 
      });
    }

    res.json({ success: true, reply: aiReply });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};


// GET /api/ai/history
export const getChatHistory = async (req, res) => {
  try {
    const history = await ChatHistory.findOne({ where: { userId: req.user.id } });
    res.json({ success: true, messages: history ? (history.messages || []) : [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/ai/history
export const clearChatHistory = async (req, res) => {
  try {
    await ChatHistory.destroy({ where: { userId: req.user.id } });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/ai/public-chat
export const publicChat = async (req, res) => {
  try {
    const { message, history, language } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini API key not configured. Please add GEMINI_API_KEY to backend/.env' 
      });
    }

    // Determine final language
    const detectedLang = detectLanguage(message);
    const finalLanguage = detectedLang || language || 'english';
    const systemPrompt = SYSTEM_PROMPTS[finalLanguage] || SYSTEM_PROMPTS.english;

    const recentMessages = (history || []).slice(-6);

    let aiReply;
    try {
      aiReply = await callGeminiWithRetry(apiKey, message, systemPrompt, recentMessages);
    } catch (apiErr) {
      console.error('[Gemini Public Error Handler]:', apiErr.message);
      return res.status(503).json({ 
        success: false, 
        message: apiErr.message 
      });
    }

    res.json({ success: true, reply: aiReply, language: finalLanguage });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

