import User from '../models/User.js';
import Medicine from '../models/Medicine.js';
import Notification from '../models/Notification.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { callGeminiWithRetry } from './aiRoutes.js';

// Helper to calculate adherence
const calculateAdherence = (medicines) => {
  if (!medicines || medicines.length === 0) return 0;
  const today = new Date().toISOString().split('T')[0];
  let totalTaken = 0;
  let totalScheduled = medicines.length;

  medicines.forEach(m => {
    if (m.takenDates?.includes(today)) {
      totalTaken++;
    }
  });

  return Math.round((totalTaken / totalScheduled) * 100);
};

// GET /api/caregiver/patients
export const getAssignedPatients = async (req, res) => {
  try {
    if (req.user.role !== 'caregiver' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const patients = await User.findAll({
      where: { caregiverId: req.user.id, role: 'patient' },
      attributes: ['id', 'name', 'email', 'phone', 'bloodGroup', 'dateOfBirth']
    });

    const enrichedPatients = await Promise.all(patients.map(async (p) => {
      const meds = await Medicine.findAll({ where: { patientId: p.id, isActive: true } });
      const adherence = calculateAdherence(meds);
      const lowStockCount = meds.filter(m => m.stock <= m.refillAt).length;

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        bloodGroup: p.bloodGroup,
        dateOfBirth: p.dateOfBirth,
        adherence,
        lowStockCount,
        totalMedicines: meds.length
      };
    }));

    res.json({ success: true, patients: enrichedPatients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/caregiver/assign-patient
export const assignPatient = async (req, res) => {
  try {
    if (req.user.role !== 'caregiver') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Patient email required' });

    const patient = await User.findOne({ where: { email, role: 'patient' } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient with this email not found' });

    if (patient.caregiverId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Patient is already assigned to you' });
    }

    await patient.update({ caregiverId: req.user.id });

    // Send notification to patient
    await Notification.create({
      recipientId: patient.id,
      title: 'Caregiver Assigned',
      message: `${req.user.name} has been assigned as your caregiver. They will help monitor your health and medications!`,
      type: 'caregiver'
    });

    res.json({ success: true, message: `Successfully assigned patient ${patient.name}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/caregiver/patient/:patientId/summary
export const getPatientSummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ where: { id: patientId, caregiverId: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found or not assigned to you' });

    const medicines = await Medicine.findAll({ where: { patientId, isActive: true } });
    const notifications = await Notification.findAll({ where: { recipientId: patientId }, limit: 15, order: [['createdAt', 'DESC']] });

    res.json({
      success: true,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address
      },
      medicines,
      notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/caregiver/insights/:patientId
export const getPatientInsights = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await User.findOne({ where: { id: patientId, caregiverId: req.user.id } });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found or not assigned to you' });

    const medicines = await Medicine.findAll({ where: { patientId, isActive: true } });
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(503).json({ success: false, message: 'Gemini API key not configured.' });
    }

    const medsSummary = medicines.map(m => {
      const today = new Date().toISOString().split('T')[0];
      const takenCount = m.takenDates?.length || 0;
      const missedCount = m.missedDates?.length || 0;
      const takenToday = m.takenDates?.includes(today) ? 'Yes' : 'No';
      return `Medicine: ${m.name}, Dosage: ${m.dosage}, Instructions: ${m.instructions || 'None'}, Times: ${m.timings.join(', ')}, Total Taken Days: ${takenCount}, Total Missed Days: ${missedCount}, Taken Today: ${takenToday}, Stock Left: ${m.stock}`;
    }).join('\n');

    const prompt = `You are a clinical AI health assistant. Review this patient's medication schedule and history to generate a caregiver brief:
Patient Name: ${patient.name}
Blood Group: ${patient.bloodGroup || 'Not specified'}
Medicines Status:
${medsSummary || 'No scheduled medicines.'}

Provide a structured assessment (in clear markdown format) containing:
1. **Compliance Overview:** A brief comment on how well the patient is adhering to their medications.
2. **Key Clinical Risks:** Note any critical items (e.g. low stock, missed doses, dosage frequency issues).
3. **Actionable Caregiver Tips:** 3 practical tips for the caregiver to help improve the patient's wellness and adherence.
Remind the caregiver that this is an AI advisory and they should refer to a primary clinician for major changes. Keep it professional, highly encouraging, and empathetic.`;

    const systemPrompt = "You are a clinical AI health assistant. Review this patient's medication schedule and history to generate a caregiver brief.";
    const text = await callGeminiWithRetry(apiKey, prompt, systemPrompt);

    res.json({ success: true, insights: text });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate AI insights: ' + err.message });
  }
};
