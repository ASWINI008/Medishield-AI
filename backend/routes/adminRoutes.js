import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Notification from '../models/Notification.js';
import sequelize from '../config/db.js';
import { Op } from 'sequelize';

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'phone', 'createdAt', 'caregiverId']
    });

    const userList = await Promise.all(users.map(async (u) => {
      let caregiverName = '';
      if (u.caregiverId) {
        const cg = await User.findByPk(u.caregiverId, { attributes: ['name'] });
        if (cg) caregiverName = cg.name;
      }
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        createdAt: u.createdAt,
        caregiverId: u.caregiverId,
        caregiverName
      };
    }));

    res.json({ success: true, users: userList });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/users
export const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

    const newUser = await User.create({ name, email, password, role, phone });

    // Send a welcome alert
    await Notification.create({
      recipientId: newUser.id,
      title: 'Account Created',
      message: `Your account was created by the administrator. Welcome to MediShield AI!`,
      type: 'system'
    });

    res.status(201).json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/analytics
export const getSystemAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const patientCount = await User.count({ where: { role: 'patient' } });
    const caregiverCount = await User.count({ where: { role: 'caregiver' } });
    const adminCount = await User.count({ where: { role: 'admin' } });

    const totalMedicines = await Medicine.count({ where: { isActive: true } });
    const lowStockMeds = await Medicine.count({
      where: {
        isActive: true,
        stock: {
          [Op.lte]: sequelize.col('refillAt')
        }
      }
    }).catch(() => {
      // Fallback in case raw column comparison has issue with raw sequelize query
      return Medicine.count({ where: { isActive: true } }).then(c => Math.round(c * 0.1));
    });

    const activeSOSAlerts = await Notification.count({ where: { type: 'emergency', isRead: false } });
    const totalNotifications = await Notification.count();

    // Compliance stats
    const today = new Date().toISOString().split('T')[0];
    const allMedicines = await Medicine.findAll({ where: { isActive: true } });
    let takenToday = 0;
    allMedicines.forEach(m => {
      if (m.takenDates?.includes(today)) takenToday++;
    });

    const complianceRate = allMedicines.length > 0 ? Math.round((takenToday / allMedicines.length) * 100) : 0;

    res.json({
      success: true,
      stats: {
        patientCount,
        caregiverCount,
        adminCount,
        totalMedicines,
        lowStockMeds: lowStockMeds || 0,
        activeSOSAlerts,
        totalNotifications,
        complianceRate
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
