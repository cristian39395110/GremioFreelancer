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

/* ======================
   PUT ACTUALIZAR GREMI0 (mantiene fotos)
====================== */
/* ======================
   PUT ACTUALIZAR GREMI0 (PRO)
   - Mantiene fotoUrl por ID
   - Edita / agrega / elimina integrantes
   - Reemplaza logo/carta solo si vienen nuevos
====================== */
router.put("/:id", upload.any(), async (req, res) => {
  try {
    const gremioId = req.params.id;
    const { nombre, rut, rubro, region, descripcion, integrantes } = req.body;

    // 1) Buscar gremio + integrantes actuales
    const gremio = await Gremio.findByPk(gremioId, {
      include: { model: Integrante, as: "integrantes" },
    });
    if (!gremio) {
      return res.status(404).json({ message: "Gremio no encontrado" });
    }

    // 2) Validaciones mínimas
    if (!nombre || !rubro || !region) {
      return res.status(400).json({ message: "Datos obligatorios faltantes" });
    }

    // 3) Normalizar RUT
    const rutStr = typeof rut === "string" ? rut : "";
    const rutFinal =
      rutStr.trim() === "" || rutStr === "null" ? null : rutStr.trim();

    // 4) Parsear integrantes
    let integrantesParsed = [];
    try {
      integrantesParsed = integrantes ? JSON.parse(integrantes) : [];
      if (!Array.isArray(integrantesParsed)) integrantesParsed = [];
    } catch {
      return res
        .status(400)
        .json({ message: "Integrantes inválidos (JSON mal formado)" });
    }

    // 5) Files: logo/carta (solo si vienen)
    const files = req.files || [];
    const logoFile = files.find((f) => f.fieldname === "logo");
    const cartaFile = files.find((f) => f.fieldname === "cartaAdhesion");

    const nuevoLogoUrl = logoFile
      ? await subirArchivo(logoFile.buffer, "multigremial/gremios/logos")
      : null;

    const nuevaCartaPdfUrl = cartaFile
      ? await subirArchivo(
          cartaFile.buffer,
          "multigremial/gremios/cartas",
          "raw"
        )
      : null;

    // 6) Actualizar gremio
    await gremio.update({
      nombre: nombre.trim(),
      rut: rutFinal,
      rubro,
      region,
      descripcion: descripcion?.trim() || null,
      logoUrl: nuevoLogoUrl ?? gremio.logoUrl,
      cartaPdfUrl: nuevaCartaPdfUrl ?? gremio.cartaPdfUrl,
    });

    // 7) Map de integrantes actuales por ID
    const actuales = gremio.integrantes || [];
    const actualesById = new Map();
    for (const it of actuales) actualesById.set(String(it.id), it);

    // 8) IDs que vienen en request (para saber cuáles borrar)
    const idsRequest = new Set(
      integrantesParsed
        .map((i) => i?.id)
        .filter((id) => id !== null && id !== undefined)
        .map((id) => String(id))
    );

    // 9) Borrar integrantes que ya no están (solo los que existían)
    const idsActuales = actuales.map((i) => String(i.id));
    const idsABorrar = idsActuales.filter((id) => !idsRequest.has(id));
    if (idsABorrar.length > 0) {
      await Integrante.destroy({ where: { id: idsABorrar } });
    }

    // 10) Crear/Actualizar integrantes
    for (let idx = 0; idx < integrantesParsed.length; idx++) {
      const it = integrantesParsed[idx];

      // Normalizar correo/telefono
      const correoStr = typeof it.correo === "string" ? it.correo : "";
      const correoFinal =
        correoStr.trim() === "" || correoStr === "null"
          ? null
          : correoStr.trim();

      const telefonoStr = typeof it.telefono === "string" ? it.telefono : "";
      const telefonoFinal =
        telefonoStr.trim() === "" || telefonoStr === "null"
          ? null
          : telefonoStr.trim();

      const nombreFinal = String(it.nombre || "").trim();
      const cargoFinal = it.cargo || "Miembro";

      // Foto: por ID o por "new"
      let fotoUrlFinal = null;

      if (it.id) {
        const idStr = String(it.id);
        const existente = actualesById.get(idStr);

        // si subió foto nueva para ESTE ID:
        const fotoFile = files.find(
          (f) => f.fieldname === `integranteFotoId_${idStr}`
        );

        if (fotoFile) {
          fotoUrlFinal = await subirArchivo(
            fotoFile.buffer,
            "multigremial/integrantes/fotos"
          );
        } else {
          // mantener la foto anterior si existe, o la que te mandó el frontend
          fotoUrlFinal =
            (existente && existente.fotoUrl) ||
            (it.fotoUrl && String(it.fotoUrl)) ||
            null;
        }

        // Update existente
        await Integrante.update(
          {
            nombre: nombreFinal,
            telefono: telefonoFinal,
            correo: correoFinal,
            cargo: cargoFinal,
            fotoUrl: fotoUrlFinal,
          },
          { where: { id: it.id, gremioId: gremio.id } }
        );
      } else {
        // Nuevo integrante
        const fotoFile = files.find(
          (f) => f.fieldname === `integranteFotoNew_${idx}`
        );

        if (fotoFile) {
          fotoUrlFinal = await subirArchivo(
            fotoFile.buffer,
            "multigremial/integrantes/fotos"
          );
        } else {
          // si no sube foto, queda null (o si te mandó fotoUrl por alguna razón)
          fotoUrlFinal = it.fotoUrl ? String(it.fotoUrl) : null;
        }

        await Integrante.create({
          nombre: nombreFinal,
          telefono: telefonoFinal,
          correo: correoFinal,
          cargo: cargoFinal,
          fotoUrl: fotoUrlFinal,
          gremioId: gremio.id,
        });
      }
    }

    // 11) Devolver gremio actualizado
    const gremioActualizado = await Gremio.findByPk(gremio.id, {
      include: { model: Integrante, as: "integrantes" },
    });

    return res.json({ ok: true, gremio: gremioActualizado });
  } catch (error) {
    console.error("❌ Error al actualizar gremio (PRO):", error);
    return res.status(500).json({ message: "Error al actualizar gremio" });
  }
});


module.exports = router;
