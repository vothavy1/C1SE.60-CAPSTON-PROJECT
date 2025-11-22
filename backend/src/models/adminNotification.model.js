const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminNotification = sequelize.define('AdminNotification', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('RECRUITER_NO_COMPANY', 'RECRUITER_REQUEST_NEW_COMPANY', 'SYSTEM_ALERT'),
    allowNull: false,
    comment: 'Loại thông báo'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Tiêu đề thông báo'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Nội dung thông báo'
  },
  related_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID user liên quan'
  },
  related_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dữ liệu bổ sung (username, email, ip...)'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Đã đọc chưa'
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    defaultValue: 'MEDIUM',
    comment: 'Mức độ ưu tiên'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_notifications',
  timestamps: false
});

module.exports = AdminNotification;
