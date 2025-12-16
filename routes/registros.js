// routes/registrados.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Registrado } = require("../models"); // ajustá si tu index está en otro lado



const API_DPA = "https://apis.digital.gob.cl/dpa";

// cache simple en memoria (te ahorra llamadas)
let cache = {
  regiones: null,
  comunas: null,
  tsRegiones: 0,
  tsComunas: 0,
};

const TTL = 1000 * 60 * 60 * 24; // 24h

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Error ${r.status} al pedir ${url}`);
  return r.json();
}

router.get("/regiones", async (_req, res) => {
  try {
    const now = Date.now();
    if (cache.regiones && now - cache.tsRegiones < TTL) {
      return res.json(cache.regiones);
    }

    const data = await fetchJSON(`${API_DPA}/regiones`);
    cache.regiones = data;
    cache.tsRegiones = now;
    res.json(data);
  } catch (e) {
    console.error("❌ geo/regiones:", e);
    res.status(500).json({ message: "Error cargando regiones" });
  }
});

router.get("/comunas", async (_req, res) => {
  try {
    const now = Date.now();
    if (cache.comunas && now - cache.tsComunas < TTL) {
      return res.json(cache.comunas);
    }

    const data = await fetchJSON(`${API_DPA}/comunas`);
    cache.comunas = data;
    cache.tsComunas = now;
    res.json(data);
  } catch (e) {
    console.error("❌ geo/comunas:", e);
    res.status(500).json({ message: "Error cargando comunas" });
  }
});




// Helpers para normalizar opcionales
const cleanStr = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s || s === "null" || s === "undefined") return null;
  return s;
};

/* ======================
   POST CREAR
====================== */
router.post("/", async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      genero,
      fechaNacimiento,
      rut,
      telefono,
      email,
      region,
      comuna,
      tipoEmpresa,
      numeroTrabajadores,
      rubro,
      asesoriaSobre,
    } = req.body;

    if (!cleanStr(nombres) || !cleanStr(apellidos)) {
      return res.status(400).json({ message: "Nombres y apellidos son obligatorios" });
    }

    const nuevo = await Registrado.create({
      nombres: cleanStr(nombres),
      apellidos: cleanStr(apellidos),
      genero: cleanStr(genero),
      fechaNacimiento: cleanStr(fechaNacimiento), // DATEONLY acepta "YYYY-MM-DD"
      rut: cleanStr(rut),
      telefono: cleanStr(telefono),
      email: cleanStr(email),
      region: cleanStr(region),
      comuna: cleanStr(comuna),
      tipoEmpresa: cleanStr(tipoEmpresa),
      numeroTrabajadores: cleanStr(numeroTrabajadores),
      rubro: cleanStr(rubro),
      asesoriaSobre: cleanStr(asesoriaSobre),
    });

    return res.json({ ok: true, id: nuevo.id });
  } catch (e) {
    console.error("❌ Error al crear registrado:", e);
    return res.status(500).json({ message: "Error al crear registrado" });
  }
});

/* ======================
   GET LISTAR + BUSCAR
   Query params:
   - q (busca en nombres/apellidos/email/rut)
   - region
   - genero
   - rubro
====================== */
router.get("/", async (req, res) => {
  try {
    const q = cleanStr(req.query.q);
    const region = cleanStr(req.query.region);
    const genero = cleanStr(req.query.genero);
    const rubro = cleanStr(req.query.rubro);

    const where = {};

    if (q) {
      where[Op.or] = [
        { nombres: { [Op.like]: `%${q}%` } },
        { apellidos: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { rut: { [Op.like]: `%${q}%` } },
      ];
    }
    if (region) where.region = region;
    if (genero) where.genero = genero;
    if (rubro) where.rubro = rubro;

    const rows = await Registrado.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(rows);
  } catch (e) {
    console.error("❌ Error al listar registrados:", e);
    res.status(500).json({ message: "Error al obtener registrados" });
  }
});

/* ======================
   GET POR ID
====================== */
router.get("/:id", async (req, res) => {
  try {
    const r = await Registrado.findByPk(req.params.id);
    if (!r) return res.status(404).json({ message: "Registrado no encontrado" });
    res.json(r);
  } catch (e) {
    res.status(500).json({ message: "Error al obtener registrado" });
  }
});

/* ======================
   PUT EDITAR
   - no obliga a re-enviar todo
====================== */
router.put("/:id", async (req, res) => {
  try {
    const r = await Registrado.findByPk(req.params.id);
    if (!r) return res.status(404).json({ message: "Registrado no encontrado" });

    const patch = {};
    const campos = [
      "nombres",
      "apellidos",
      "genero",
      "fechaNacimiento",
      "rut",
      "telefono",
      "email",
      "region",
      "tipoEmpresa",
      "numeroTrabajadores",
      "rubro",
      "asesoriaSobre",
    ];

    for (const c of campos) {
      if (req.body[c] !== undefined) {
        patch[c] = cleanStr(req.body[c]);
      }
    }

    // si mandan nombres/apellidos vacíos, lo cortamos (son obligatorios)
    if (patch.nombres !== undefined && !patch.nombres) {
      return res.status(400).json({ message: "Nombres no puede quedar vacío" });
    }
    if (patch.apellidos !== undefined && !patch.apellidos) {
      return res.status(400).json({ message: "Apellidos no puede quedar vacío" });
    }

    await r.update(patch);

    res.json({ ok: true });
  } catch (e) {
    console.error("❌ Error al editar registrado:", e);
    res.status(500).json({ message: "Error al actualizar registrado" });
  }
});

/* ======================
   DELETE BORRAR
====================== */
router.delete("/:id", async (req, res) => {
  try {
    const r = await Registrado.findByPk(req.params.id);
    if (!r) return res.status(404).json({ message: "Registrado no encontrado" });

    await r.destroy();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Error al eliminar registrado" });
  }
});

module.exports = router;
