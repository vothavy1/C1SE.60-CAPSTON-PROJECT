const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define(
  'Company',
  {
    company_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'company_id'
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      field: 'companyName'
    },
    companyCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'companyCode'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    website: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'website'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      field: 'status'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updatedAt'
    },
  },
  {
    tableName: 'companies',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);

module.exports = Company;
