const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const Admin = require('../models/Admin'); // 👈 IMPORTÁ TU MODELO REAL





const autenticarAdmin = require("../middlewares/authAdmin");

router.put("/cambiar-email", autenticarAdmin, async (req, res) => {
  let { email } = req.body;

  // ✅ normalizar
  email = (email || "").trim().toLowerCase();

  // ✅ validar
  if (!email) {
    return res.status(400).json({ error: "Email requerido" });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    // ✅ traer admin actual
    const admin = await Admin.findByPk(req.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin no encontrado" });
    }

    // ✅ si es el mismo email, no hagas update al pedo
    if ((admin.email || "").toLowerCase() === email) {
      return res.status(400).json({ error: "Ese email ya es tuyo" });
    }

    // ✅ verificar que no exista en otro admin
    const existe = await Admin.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ error: "El email ya está en uso" });
    }

    await Admin.update({ email }, { where: { id: req.adminId } });

    return res.json({ ok: true, message: "Email actualizado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar email" });
  }
});


router.put("/cambiar-password", autenticarAdmin, async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    const admin = await Admin.findByPk(req.adminId);
    if (!admin) {
      return res.status(404).json({ error: "Admin no encontrado" });
    }

    // ✅ validar contra passwordHash
    const ok = await bcrypt.compare(passwordActual, admin.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: "Contraseña actual incorrecta" });
    }

    // hashear nueva
    const hash = await bcrypt.hash(passwordNueva, 10);

    // ✅ guardar en passwordHash
    await Admin.update(
      { passwordHash: hash },
      { where: { id: req.adminId } }
    );

    return res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar contraseña" });
  }
});

router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  // ✅ normalizar email
  email = (email || "").trim().toLowerCase();

  // ✅ validar datos
  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // buscar admin
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // validar contraseña
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // generar token
    const token = jwt.sign(
      { id: admin.id, rol: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // respuesta mínima (no devuelvas todo el admin)
    return res.json({
      token,
      usuario: {
        id: admin.id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error('LOGIN ADMIN ERROR:', err);
    return res.status(500).json({ message: 'Error interno' });
  }
});


module.exports = router;
