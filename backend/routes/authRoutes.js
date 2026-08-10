import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, phone: u.phone, bloodGroup: u.bloodGroup, address: u.address });

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await User.create({ name, email, password, role: role || 'patient' });
    await Notification.create({ recipientId: user.id, title: 'Welcome to MediShield AI!', message: 'Your account has been created successfully. Stay healthy!', type: 'system' });

    res.status(201).json({ success: true, token: generateToken(user.id), user: safeUser(user) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'All fields required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    if (user.isLocked()) return res.status(429).json({ success: false, message: 'Account locked. Try again in 15 minutes.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    res.json({ success: true, token: generateToken(user.id), user: safeUser(user) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({ success: true, user: safeUser(req.user) });
};
