const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Gremio = sequelize.define('Gremio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },

rut: {
  type: DataTypes.STRING,
  allowNull: true,
},


  rubro: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  region: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  cartaPdfUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'gremios',
  timestamps: true,
});

module.exports = Gremio;
