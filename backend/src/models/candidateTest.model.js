const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define CandidateTest model
const CandidateTest = sequelize.define('CandidateTest', {
  candidate_test_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidate_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'candidates',
      key: 'candidate_id'
    }
  },
  test_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tests',
      key: 'test_id'
    }
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'candidate_job_applications',
      key: 'application_id'
    }
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'),
    allowNull: false,
    defaultValue: 'ASSIGNED'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  manual_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 0,
    comment: 'Manual score given by recruiter for essay questions'
  },
  passing_status: {
    type: DataTypes.ENUM('PASSED', 'FAILED', 'PENDING'),
    allowNull: true,
    defaultValue: 'PENDING'
  },
  is_result_visible: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: 0,
    field: 'is_result_visible'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'candidate_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false  // Disable updatedAt since the table doesn't have this column
});

module.exports = CandidateTest;
