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

  fechaCreacion: {
  type: DataTypes.DATEONLY,
  allowNull: true,
},

numeroSocios: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

numeroEmpresas: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

  region: {
    type: DataTypes.STRING,
    allowNull: false,
  },
provincia: {
  type: DataTypes.STRING,
  allowNull: true,
},

ciudad: {
  type: DataTypes.STRING,
  allowNull: true,
},

direccion: {
  type: DataTypes.STRING,
  allowNull: true,
},

sitioWeb: {
  type: DataTypes.STRING,
  allowNull: true,
},

email: {
  type: DataTypes.STRING,
  allowNull: true,
},

redesSociales: {
  type: DataTypes.TEXT,
  allowNull: true,
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
  estado: {
  type: DataTypes.ENUM('pendiente', 'aprobado', 'rechazado'),
  allowNull: false,
  defaultValue: 'aprobado',
},
}, {
  tableName: 'gremios',
  timestamps: true,
});

module.exports = Gremio;
