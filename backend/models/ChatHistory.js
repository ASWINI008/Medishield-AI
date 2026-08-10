import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ChatHistory = sequelize.define('ChatHistory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  messages: { type: DataTypes.JSON, defaultValue: [] },
}, { tableName: 'chat_history', timestamps: true });

export default ChatHistory;
