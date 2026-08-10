import User from '../models/User.js';

// GET /api/users/profile
export const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, bloodGroup, address } = req.body;
    await req.user.update({ name, phone, dateOfBirth, bloodGroup, address });
    res.json({ success: true, user: req.user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
