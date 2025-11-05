const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define TestFraudLog model
const TestFraudLog = sequelize.define('TestFraudLog', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidate_test_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'candidate_tests',
      key: 'candidate_test_id'
    }
  },
  event_type: {
    type: DataTypes.ENUM('TAB_SWITCH', 'COPY_PASTE', 'MULTIPLE_WINDOWS', 'SCREENSHOT', 'OTHER'),
    allowNull: false,
    comment: 'Type of violation detected'
  },
  event_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Number of times this event occurred'
  },
  event_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'When the violation was detected'
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional details about the violation'
  }
}, {
  tableName: 'test_fraud_logs',
  timestamps: false,
  indexes: [
    {
      name: 'idx_candidate_test_id',
      fields: ['candidate_test_id']
    },
    {
      name: 'idx_event_type',
      fields: ['event_type']
    },
    {
      name: 'idx_event_time',
      fields: ['event_time']
    }
  ]
});

module.exports = TestFraudLog;
