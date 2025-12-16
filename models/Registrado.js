// models/Registrado.js


const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Registrado = sequelize.define(
  "Registrado",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    nombres: { type: DataTypes.STRING, allowNull: false },
    apellidos: { type: DataTypes.STRING, allowNull: false },

    genero: {
      type: DataTypes.ENUM("Masculino", "Femenino", "Otro"),
      allowNull: true, // opcional
    },

    fechaNacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true, // opcional
    },

    rut: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },

    telefono: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
      validate: { isEmail: true },
    },

    region: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },
    comuna: { 
      type: DataTypes.STRING, 
      allowNull: true },


    tipoEmpresa: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },

    numeroTrabajadores: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },

    rubro: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },

    asesoriaSobre: {
      type: DataTypes.STRING,
      allowNull: true, // opcional
    },
  },
  {
    tableName: "registrados",
    timestamps: true, // createdAt / updatedAt
  }
);

module.exports = Registrado;
