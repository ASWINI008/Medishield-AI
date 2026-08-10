import User from '../models/User.js';
import Notification from '../models/Notification.js';

// POST /api/emergency/sos
export const triggerSOS = async (req, res) => {
  try {
    const patientId = req.user.id;
    const patientName = req.user.name;

    // 1. Create emergency alert for the patient
    await Notification.create({
      recipientId: patientId,
      title: '🚨 Emergency SOS Triggered',
      message: 'You have triggered an emergency SOS. Support has been notified and we are coordinating help!',
      type: 'emergency'
    });

    // 2. Find and notify the caregiver if assigned
    const user = await User.findByPk(patientId);
    let caregiverNotified = false;

    if (user && user.caregiverId) {
      await Notification.create({
        recipientId: user.caregiverId,
        title: `🚨 EMERGENCY SOS: ${patientName}`,
        message: `Your assigned patient ${patientName} has triggered an Emergency SOS alert! Please contact them immediately at ${user.phone || 'their registered number'}.`,
        type: 'emergency'
      });
      caregiverNotified = true;
    }

    res.json({
      success: true,
      message: 'SOS triggered successfully.',
      caregiverNotified
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
