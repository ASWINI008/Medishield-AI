import Medicine from '../models/Medicine.js';
import Notification from '../models/Notification.js';

// GET /api/medicines
export const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findAll({ where: { patientId: req.user.id, isActive: true }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, medicines });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/medicines
export const createMedicine = async (req, res) => {
  try {
    const { name, dosage, frequency, timings, instructions, startDate, endDate, stock, color } = req.body;
    if (!name || !dosage) return res.status(400).json({ success: false, message: 'Name and dosage required' });
    const medicine = await Medicine.create({ patientId: req.user.id, name, dosage, frequency, timings, instructions, startDate, endDate, stock, color });
    await Notification.create({ recipientId: req.user.id, title: 'Medicine Added', message: `${name} (${dosage}) added to your schedule.`, type: 'system', relatedMedicineId: medicine.id });
    res.status(201).json({ success: true, medicine });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/medicines/:id
export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ where: { id: req.params.id, patientId: req.user.id } });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    await medicine.update(req.body);
    res.json({ success: true, medicine });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/medicines/:id  (soft delete)
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ where: { id: req.params.id, patientId: req.user.id } });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    await medicine.update({ isActive: false });
    res.json({ success: true, message: 'Medicine removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/medicines/:id/take
export const takeMedicine = async (req, res) => {
  try {
    const { date } = req.body;
    const medicine = await Medicine.findOne({ where: { id: req.params.id, patientId: req.user.id } });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const today = date || new Date().toISOString().split('T')[0];
    const takenDates = medicine.takenDates || [];
    if (!takenDates.includes(today)) takenDates.push(today);
    const missedDates = (medicine.missedDates || []).filter(d => d !== today);
    const newStock = Math.max(0, medicine.stock - 1);

    await medicine.update({ takenDates, missedDates, stock: newStock });

    if (newStock <= medicine.refillAt) {
      await Notification.create({ recipientId: req.user.id, title: 'Refill Alert', message: `${medicine.name} stock is low (${newStock} remaining). Please refill soon.`, type: 'refill', relatedMedicineId: medicine.id });
    }
    res.json({ success: true, medicine });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
