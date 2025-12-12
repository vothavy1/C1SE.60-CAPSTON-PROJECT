const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define JobPosition model
const JobPosition = sequelize.define('JobPosition', {
  position_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'company_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  job_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  positions_available: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'job_positions',
  timestamps: false
});

module.exports = JobPosition;
