const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define CandidateTestAnswer model
const CandidateTestAnswer = sequelize.define('CandidateTestAnswer', {
  answer_id: {
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
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'question_id'
    }
  },
  selected_options: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'selected_options'
  },
  text_answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  code_answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: 0
  },
  score_earned: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'score_earned'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  }
}, {
  tableName: 'candidate_test_answers',
  timestamps: false  // No timestamps in this table
});

module.exports = CandidateTestAnswer;
