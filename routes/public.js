
//public 
const express = require("express");
const { Op } = require("sequelize");

const router = express.Router();

const { Gremio, Integrante } = require("../models");
const upload = require("../middlewares/multer");



/* ======================
   LISTADO PUBLICO DE GREMIOS APROBADOS
====================== */
router.get("/gremios", async (req, res) => {
  try {
    const { buscar = "", page = 1, limit = 12, rubro, region } = req.query;

    const whereGremio = {
      estado: "aprobado",
    };

    if (rubro) {
      whereGremio.rubro = rubro;
    }

    if (region) {
      whereGremio.region = region;
    }

    if (buscar) {
      whereGremio[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { rubro: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const resultado = await Gremio.findAndCountAll({
      where: whereGremio,
      include: {
        model: Integrante,
        as: "integrantes",
        required: false,
        where: buscar
          ? {
              [Op.or]: [
                { nombre: { [Op.like]: `%${buscar}%` } },
                { cargo: { [Op.like]: `%${buscar}%` } },
              ],
            }
          : undefined,
      },
      distinct: true,
      limit: Number(limit),
      offset,
      order: [["nombre", "ASC"]],
    });

    res.json({
      total: resultado.count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(resultado.count / Number(limit)),
      gremios: resultado.rows,
    });
  } catch (error) {
    console.error("Error público gremios:", error);
    res.status(500).json({ message: "Error al obtener gremios públicos" });
  }
});

/* ======================
   FICHA PUBLICA DE GREMIO
====================== */
router.get("/gremios/:id", async (req, res) => {
  try {
    const gremio = await Gremio.findOne({
      where: {
        id: req.params.id,
        estado: "aprobado",
      },
      include: {
        model: Integrante,
        as: "integrantes",
      },
    });

    if (!gremio) {
      return res.status(404).json({ message: "Gremio no encontrado" });
    }

    res.json(gremio);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener ficha pública" });
  }
});

/* ======================
   AGRUPADOS POR RUBRO
====================== */
router.get("/gremios-por-rubro", async (req, res) => {
  try {
    const gremios = await Gremio.findAll({
      where: { estado: "aprobado" },
      include: {
        model: Integrante,
        as: "integrantes",
      },
      order: [["rubro", "ASC"], ["nombre", "ASC"]],
    });

    const agrupados = {};

    for (const gremio of gremios) {
      const rubro = gremio.rubro || "Sin rubro";
      if (!agrupados[rubro]) agrupados[rubro] = [];
      agrupados[rubro].push(gremio);
    }

    res.json(agrupados);
  } catch (error) {
    res.status(500).json({ message: "Error al agrupar por rubro" });
  }
});

/* ======================
   AGRUPADOS POR REGION
====================== */
router.get("/gremios-por-region", async (req, res) => {
  try {
    const gremios = await Gremio.findAll({
      where: { estado: "aprobado" },
      include: {
        model: Integrante,
        as: "integrantes",
      },
      order: [["region", "ASC"], ["nombre", "ASC"]],
    });

    const agrupados = {};

    for (const gremio of gremios) {
      const region = gremio.region || "Sin región";
      if (!agrupados[region]) agrupados[region] = [];
      agrupados[region].push(gremio);
    }

    res.json(agrupados);
  } catch (error) {
    res.status(500).json({ message: "Error al agrupar por región" });
  }
});

/* ======================
   REGISTRO PUBLICO DE GREMIO
====================== */
/* ======================
   REGISTRO PUBLICO DE GREMIO
====================== */
router.post("/registro-gremio", upload.any(), async (req, res) => {
  try {
    const {
      nombre,
      rut,
      rubro,
      fechaCreacion,
      numeroSocios,
      numeroEmpresas,
      region,
      provincia,
      ciudad,
      direccion,
      sitioWeb,
      email,
      redesSociales,
      descripcion,
      integrantes,
    } = req.body;

    if (!nombre || !rubro || !region || !email) {
      return res.status(400).json({
        message: "Nombre, rubro, región y email son obligatorios",
      });
    }

    let integrantesParsed = [];

    try {
      integrantesParsed = integrantes ? JSON.parse(integrantes) : [];
      if (!Array.isArray(integrantesParsed)) integrantesParsed = [];
    } catch {
      return res.status(400).json({
        message: "Integrantes inválidos",
      });
    }

    if (integrantesParsed.length === 0) {
      return res.status(400).json({
        message: "Debe agregar al menos un miembro del directorio",
      });
    }

    const files = req.files || [];

    const logoFile = files.find((f) => f.fieldname === "logo");
    const cartaFile = files.find((f) => f.fieldname === "cartaAdhesion");

    if (cartaFile && cartaFile.mimetype !== "application/pdf") {
  return res.status(400).json({
    message: "La ficha firmada debe subirse en formato PDF",
  });
}

const logoUrl = logoFile
  ? `/uploads/logos/${logoFile.filename}`
  : null;

const cartaPdfUrl = cartaFile
  ? `/uploads/cartas/${cartaFile.filename}`
  : null;

    if (!cartaPdfUrl) {
      return res.status(400).json({
        message: "Debe subir la ficha completada y firmada",
      });
    }

    const limpiar = (valor) => {
      if (valor === undefined || valor === null) return null;
      const texto = String(valor).trim();
      if (!texto || texto === "null" || texto === "undefined") return null;
      return texto;
    };

    const numeroONull = (valor) => {
      const limpio = limpiar(valor);
      if (limpio === null) return null;

      const numero = Number(limpio);
      return Number.isNaN(numero) ? null : numero;
    };

    const fechaONull = (valor) => {
      const limpio = limpiar(valor);
      return limpio || null;
    };

    const gremio = await Gremio.create({
      nombre: limpiar(nombre),
      rut: limpiar(rut),
      rubro: limpiar(rubro),
      fechaCreacion: fechaONull(fechaCreacion),
      numeroSocios: numeroONull(numeroSocios),
      numeroEmpresas: numeroONull(numeroEmpresas),
      region: limpiar(region),
      provincia: limpiar(provincia),
      ciudad: limpiar(ciudad),
      direccion: limpiar(direccion),
      sitioWeb: limpiar(sitioWeb),
      email: limpiar(email),
      redesSociales: limpiar(redesSociales),
      descripcion: limpiar(descripcion),
      logoUrl,
      cartaPdfUrl,
      estado: "pendiente",
    });

    for (const integrante of integrantesParsed) {
      const nombreIntegrante = limpiar(integrante.nombre);
      const cargoIntegrante = limpiar(integrante.cargo) || "Miembro";

      if (!nombreIntegrante) continue;

      await Integrante.create({
        nombre: nombreIntegrante,
        telefono: limpiar(integrante.telefono),
        correo: limpiar(integrante.correo),
        cargo: cargoIntegrante,
        fotoUrl: null,
        gremioId: gremio.id,
      });
    }

    res.json({
      ok: true,
      message: "Solicitud enviada. Quedará pendiente de aprobación.",
      gremioId: gremio.id,
    });
  } catch (error) {
    console.error("Error registro público:", error);
    res.status(500).json({ message: "Error al registrar gremio" });
  }
});
module.exports = router;