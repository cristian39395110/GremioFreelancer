// backend/server.js
require('dotenv').config();
const app = require('./app');  // Ya está bien
const { sequelize } = require('./models');  // Está bien si no usas 'src/'

const PORT = process.env.PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    await sequelize.sync(); // Sincronizar tablas
    console.log('✅ Tablas sincronizadas');

    app.listen(PORT, () => {
      console.log(`🚀 Backend corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar backend:', error);
    process.exit(1);
  }
})();
