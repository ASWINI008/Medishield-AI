import Notification from '../models/Notification.js';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({ where: { recipientId: req.user.id }, order: [['createdAt', 'DESC']], limit: 50 });
    res.json({ success: true, notifications });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, recipientId: req.user.id } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { recipientId: req.user.id, isRead: false } });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
