import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('patient', 'caregiver', 'admin'), defaultValue: 'patient' },
  avatar: { type: DataTypes.STRING(255), defaultValue: '' },
  phone: { type: DataTypes.STRING(20), defaultValue: '' },
  dateOfBirth: { type: DataTypes.DATEONLY },
  bloodGroup: { type: DataTypes.STRING(10), defaultValue: '' },
  address: { type: DataTypes.TEXT, defaultValue: '' },
  caregiverId: { type: DataTypes.INTEGER, allowNull: true },
  loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  lockUntil: { type: DataTypes.DATE },
  lastLogin: { type: DataTypes.DATE },
  notifEmail: { type: DataTypes.BOOLEAN, defaultValue: true },
  notifPush: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'users', timestamps: true });

// Hash password before create/update
User.beforeCreate(async (user) => { user.password = await bcrypt.hash(user.password, 12); });
User.beforeUpdate(async (user) => { if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12); });

User.prototype.comparePassword = async function (candidate) { return bcrypt.compare(candidate, this.password); };
User.prototype.isLocked = function () { return !!(this.lockUntil && this.lockUntil > new Date()); };

export default User;
