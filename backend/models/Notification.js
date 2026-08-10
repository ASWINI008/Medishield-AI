import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.ENUM('reminder', 'emergency', 'system', 'caregiver', 'refill'), defaultValue: 'system' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  relatedMedicineId: { type: DataTypes.INTEGER },
}, { tableName: 'notifications', timestamps: true });

export default Notification;
