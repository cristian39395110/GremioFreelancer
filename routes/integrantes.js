const express = require('express');
const router = express.Router();
const { Integrante, Gremio } = require('../models');

// Obtener todos los integrantes de un gremio
router.get('/:gremioId', async (req, res) => {
  const { gremioId } = req.params;

  try {
    const gremio = await Gremio.findByPk(gremioId, {
      include: {
        model: Integrante,
        as: 'integrantes',
      }
    });

    if (!gremio) {
      return res.status(404).json({ error: 'Gremio no encontrado' });
    }

    res.json(gremio.integrantes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener integrantes' });
  }
});

// Crear un nuevo integrante
router.post('/:gremioId', async (req, res) => {
  const { gremioId } = req.params;
  const { nombre, telefono, correo, fotoUrl, cargo } = req.body;

  try {
    const gremio = await Gremio.findByPk(gremioId);
    if (!gremio) {
      return res.status(404).json({ error: 'Gremio no encontrado' });
    }

    const integrante = await Integrante.create({
      gremioId,
      nombre,
      telefono,
      correo,
      fotoUrl,
      cargo,
    });

    res.status(201).json(integrante);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear integrante' });
  }
});

module.exports = router;
