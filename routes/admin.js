// C:\Users\Home\OneDrive\Escritorio\Trabajo Freelancer\multigremial-proyecto\backend\models\routes\admin.js
const express = require('express');
const router = express.Router();

const gremiosRoutes = require('./gremios');
const integrantesRoutes = require('./integrantes');
const registrosRoutes = require('./registros');

// Redirigir a las rutas de gremios e integrantes
router.use('/gremios', gremiosRoutes);
router.use('/integrantes', integrantesRoutes);
router.use('/registros', registrosRoutes);


module.exports = router;
