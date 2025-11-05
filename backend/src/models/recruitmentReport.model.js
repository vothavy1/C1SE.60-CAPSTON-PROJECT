const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define RecruitmentReport model
const RecruitmentReport = sequelize.define('RecruitmentReport', {
  report_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  report_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  report_type: {
    type: DataTypes.ENUM(
      'CANDIDATE_PIPELINE',
      'TEST_PERFORMANCE', 
      'INTERVIEWER_EFFICIENCY',
      'HIRING_METRICS',
      'CUSTOM',
      'VIOLATION',
      'STATISTICS',
      'ACTIVITY_LOG',
      'NOTIFICATION'
    ),
    allowNull: false
  },
  parameters: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('parameters');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('parameters', value ? JSON.stringify(value) : null);
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'recruitment_reports',
  timestamps: false
});

module.exports = RecruitmentReport;
