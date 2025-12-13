const express = require("express");
const router = express.Router();

const { Gremio, Integrante } = require("../models");
const upload = require("../middlewares/multer");
const cloudinary = require("../config/cloudinary");

// helper subir archivo
const subirArchivo = (buffer, folder, resource_type = "image") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
};

/* ======================
   POST CREAR GREMI0
====================== */
router.post("/", upload.any(), async (req, res) => {
  try {
    const { nombre, rut, rubro, region, descripcion, integrantes } = req.body;

    // =========================
    // Validaciones mínimas
    // =========================
    if (!nombre || !rubro || !region) {
      return res
        .status(400)
        .json({ message: "Datos obligatorios faltantes" });
    }

    // =========================
    // Normalizar RUT (opcional)
    // =========================
    const rutStr = typeof rut === "string" ? rut : "";
    const rutFinal =
      rutStr.trim() === "" || rutStr === "null" ? null : rutStr.trim();

      

    // =========================
    // Parsear integrantes (seguro)
    // =========================
    let integrantesParsed = [];
    try {
      integrantesParsed = integrantes ? JSON.parse(integrantes) : [];
    } catch {
      return res
        .status(400)
        .json({ message: "Integrantes inválidos (JSON mal formado)" });
    }

    
    // =========================
    // Archivos
    // =========================
    const files = req.files || [];

    const logoFile = files.find((f) => f.fieldname === "logo");
    const cartaFile = files.find((f) => f.fieldname === "cartaAdhesion");

    const logoUrl = logoFile
      ? await subirArchivo(logoFile.buffer, "multigremial/gremios/logos")
      : null;

    const cartaPdfUrl = cartaFile
      ? await subirArchivo(
          cartaFile.buffer,
          "multigremial/gremios/cartas",
          "raw"
        )
      : null;

    // =========================
    // Crear gremio
    // =========================
    const gremio = await Gremio.create({
      nombre: nombre.trim(),
      rut: rutFinal,
      rubro,
      region,
      descripcion: descripcion?.trim() || null,
      logoUrl,
      cartaPdfUrl,
    });

    

    // =========================
    // Crear integrantes
    // =========================
 for (let i = 0; i < integrantesParsed.length; i++) {
  const integrante = integrantesParsed[i];

  const fotoFile = files.find(
    (f) => f.fieldname === `integranteFoto_${i}`
  );

  const fotoUrl = fotoFile
    ? await subirArchivo(
        fotoFile.buffer,
        "multigremial/integrantes/fotos"
      )
    : null;

  // =========================
  // NORMALIZAR CORREO (CLAVE)
  // =========================
  const correoStr =
    typeof integrante.correo === "string" ? integrante.correo : "";

  const correoFinal =
    correoStr.trim() === "" || correoStr === "null"
      ? null
      : correoStr.trim();

      const telefonoStr =
  typeof integrante.telefono === "string" ? integrante.telefono : "";

const telefonoFinal =
  telefonoStr.trim() === "" || telefonoStr === "null"
    ? null
    : telefonoStr.trim();


  await Integrante.create({
    nombre: integrante.nombre.trim(),
    telefono: telefonoFinal,
    correo: correoFinal, // 👈 ACÁ está la diferencia
    cargo: integrante.cargo,
    fotoUrl,
    gremioId: gremio.id,
  });
}


    // =========================
    // OK
    // =========================
    res.json({ ok: true, gremioId: gremio.id });
  } catch (error) {
    console.error("❌ Error al crear gremio:", error);
    res.status(500).json({ message: "Error al crear gremio" });
  }
});

/* ======================
   GET TODOS
====================== */
router.get("/", async (req, res) => {
  try {
    const gremios = await Gremio.findAll({
      include: { model: Integrante, as: "integrantes" },
    });
    res.json(gremios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener gremios" });
  }
});

/* ======================
   GET POR ID
====================== */
router.get("/:id", async (req, res) => {
  try {
    const gremio = await Gremio.findByPk(req.params.id, {
      include: { model: Integrante, as: "integrantes" },
    });

    if (!gremio) {
      return res.status(404).json({ message: "Gremio no encontrado" });
    }

    res.json(gremio);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener gremio" });
  }
});

/* ======================
   DELETE
====================== */
router.delete("/:id", async (req, res) => {
  try {
    const gremio = await Gremio.findByPk(req.params.id);
    if (!gremio) {
      return res.status(404).json({ message: "Gremio no encontrado" });
    }

    await gremio.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar gremio" });
  }
});

module.exports = router;
