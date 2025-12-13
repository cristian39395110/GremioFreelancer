const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Integrante = sequelize.define(
  'Integrante',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 🔗 Relación con Gremio
    gremioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    correo: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true, // ✔️ suma puntos en revisión
      },
    },

    fotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cargo: {
      type: DataTypes.ENUM(
        'Presidente',
        'Vicepresidente',
        'Miembro'
      ),
      allowNull: false,
    },
  },
  {
    tableName: 'integrantes',
    timestamps: true,
  }
);

module.exports = Integrante;
