import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Medicine = sequelize.define('Medicine', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  dosage: { type: DataTypes.STRING(100), allowNull: false },
  frequency: { type: DataTypes.ENUM('once', 'twice', 'thrice', 'custom'), defaultValue: 'once' },
  timings: { type: DataTypes.JSON, defaultValue: ['08:00'] },
  instructions: { type: DataTypes.TEXT, defaultValue: '' },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  stock: { type: DataTypes.INTEGER, defaultValue: 30 },
  refillAt: { type: DataTypes.INTEGER, defaultValue: 5 },
  color: { type: DataTypes.STRING(20), defaultValue: '#2563eb' },
  takenDates: { type: DataTypes.JSON, defaultValue: [] },
  missedDates: { type: DataTypes.JSON, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'medicines', timestamps: true });

export default Medicine;
