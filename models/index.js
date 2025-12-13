const sequelize = require('../config/db');

const Admin = require('./Admin');
const Gremio = require('./Gremio');
const Integrante = require('./Integrante');

// Relaciones
Gremio.hasMany(Integrante, {
  foreignKey: 'gremioId',
  as: 'integrantes',
  onDelete: 'CASCADE',
});

Integrante.belongsTo(Gremio, {
  foreignKey: 'gremioId',
  as: 'gremio',
});

module.exports = {
  sequelize,
  Admin,
  Gremio,
  Integrante,
};
