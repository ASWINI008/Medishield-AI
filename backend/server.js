import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import sequelize from './config/db.js';
import User from './models/User.js';
import Medicine from './models/Medicine.js';
import Notification from './models/Notification.js';
import ChatHistory from './models/ChatHistory.js';

import { register, login, getMe } from './routes/authRoutes.js';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine, takeMedicine } from './routes/medicineRoutes.js';
import { chat, getChatHistory, clearChatHistory, scanPrescription, publicChat } from './routes/aiRoutes.js';
import { getNotifications, markRead, markAllRead } from './routes/notificationRoutes.js';
import { getProfile, updateProfile, changePassword } from './routes/userRoutes.js';
import { protect } from './middleware/auth.js';

import { getAssignedPatients, assignPatient, getPatientSummary, getPatientInsights } from './routes/caregiverRoutes.js';
import { getAllUsers, createUser, deleteUser, getSystemAnalytics } from './routes/adminRoutes.js';
import { triggerSOS } from './routes/emergencyRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
const frontendUrl = process.env.FRONTEND_URL;
const corsOrigin = frontendUrl 
  ? (frontendUrl.includes(',') ? frontendUrl.split(',').map(url => url.trim()) : frontendUrl)
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));

// Rate Limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(generalLimiter);

// ─── Routes ───────────────────────────────────────────────
app.get('/', (req, res) => res.json({ success: true, message: 'MediShield AI API — MySQL/Sequelize' }));

app.post('/api/auth/register', authLimiter, register);
app.post('/api/auth/login', authLimiter, login);
app.get('/api/auth/me', protect, getMe);

app.get('/api/medicines', protect, getMedicines);
app.post('/api/medicines', protect, createMedicine);
app.put('/api/medicines/:id', protect, updateMedicine);
app.delete('/api/medicines/:id', protect, deleteMedicine);
app.post('/api/medicines/:id/take', protect, takeMedicine);

app.post('/api/ai/chat', protect, chat);
app.post('/api/ai/public-chat', publicChat);
app.post('/api/ai/scan', protect, scanPrescription);
app.get('/api/ai/history', protect, getChatHistory);
app.delete('/api/ai/history', protect, clearChatHistory);

app.get('/api/notifications', protect, getNotifications);
app.put('/api/notifications/read-all', protect, markAllRead);
app.put('/api/notifications/:id/read', protect, markRead);

app.get('/api/users/profile', protect, getProfile);
app.put('/api/users/profile', protect, updateProfile);
app.put('/api/users/change-password', protect, changePassword);

// Caregiver Routes
app.get('/api/caregiver/patients', protect, getAssignedPatients);
app.post('/api/caregiver/assign-patient', protect, assignPatient);
app.get('/api/caregiver/patient/:patientId/summary', protect, getPatientSummary);
app.get('/api/caregiver/insights/:patientId', protect, getPatientInsights);

// Admin Routes
app.get('/api/admin/users', protect, getAllUsers);
app.post('/api/admin/users', protect, createUser);
app.delete('/api/admin/users/:id', protect, deleteUser);
app.get('/api/admin/analytics', protect, getSystemAnalytics);

// Emergency Routes
app.post('/api/emergency/sos', protect, triggerSOS);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ success: false, message: 'Server error' }); });

// ─── Start Server (with DB sync) ──────────────────────────
const PORT = process.env.PORT || 5000;

import mysql from 'mysql2/promise';

const start = async () => {
  try {
    // 1. Create DB if it doesn't exist using plain mysql2
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });
    const dbName = process.env.DB_NAME || 'medishield';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    // 2. Connect via Sequelize
    await sequelize.authenticate();
    console.log('✅ MySQL connected');
    
    // alter:true safely updates table schema without dropping data
    await sequelize.sync({ alter: true });
    console.log('✅ All tables synced');
    
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('👉 Please check your DB_PASS (MySQL root password) in backend/.env');
    process.exit(1);
  }
};

process.on('exit', (code) => console.log('Process exiting with code:', code));
setInterval(() => {}, 1000 * 60 * 60);

start();
