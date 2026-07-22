const path = require("path");
const XLSX = require("xlsx");
const { Op } = require("sequelize");

const { sequelize, Gremio, Integrante } = require("../models");

/* =========================
   VALORES VÁLIDOS
========================= */

const REGIONES = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén del General Carlos Ibáñez del Campo",
  "Magallanes y la Antártica Chilena",
];

const RUBROS = [
  "Acuicultura / Salmonicultura",
  "Aduanas / Portuario",
  "Agricultura",
  "Banquetería/Eventos",
  "Comercio",
  "Construcción",
  "Corporación",
  "Deporte",
  "Energía",
  "Financiero",
  "Forestal / Silvicultura",
  "Fundación",
  "Ganadería",
  "Gastronomía",
  "Hotelería / Turismo",
  "Industria",
  "Lechería",
  "Minería",
  "Reciclaje",
  "Seguridad",
  "Servicios",
  "Tecnología/Informática",
  "Transporte",
];

const CARGOS = [
  "Presidente",
  "Vicepresidente",
  "Miembro",
  "Secretario(a)",
  "Tesorero(a)",
  "Director(a)",
];

/* =========================
   HELPERS
========================= */

const limpiarTexto = (valor) => {
  if (valor === null || valor === undefined) return "";

  return String(valor).trim();
};

const normalizarComparacion = (valor) => {
  return limpiarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const buscarValorValido = (valor, lista) => {
  const valorNormalizado = normalizarComparacion(valor);

  return lista.find(
    (item) => normalizarComparacion(item) === valorNormalizado
  );
};

const obtenerRegion = (valorExcel) => {
  let region = limpiarTexto(valorExcel);

  region = region.replace(/^multigremial\s+/i, "").trim();

  const equivalencias = {
    metropolitana: "Metropolitana de Santiago",
    "region metropolitana": "Metropolitana de Santiago",
    "región metropolitana": "Metropolitana de Santiago",
    ohiggins: "O'Higgins",
    "o’higgins": "O'Higgins",
    aysen: "Aysén del General Carlos Ibáñez del Campo",
    magallanes: "Magallanes y la Antártica Chilena",
  };

  const clave = normalizarComparacion(region);

  if (equivalencias[clave]) {
    return equivalencias[clave];
  }

  return buscarValorValido(region, REGIONES);
};

const obtenerRubro = (valorExcel) => {
  const rubro = limpiarTexto(valorExcel);

  const equivalencias = {
    industrial: "Industria",
    "banqueteria / eventos": "Banquetería/Eventos",
    "banqueteria/eventos": "Banquetería/Eventos",
    tecnologia: "Tecnología/Informática",
    informatica: "Tecnología/Informática",
  };

  const clave = normalizarComparacion(rubro);

  if (equivalencias[clave]) {
    return equivalencias[clave];
  }

  return buscarValorValido(rubro, RUBROS);
};

const obtenerCargo = (valorExcel) => {
  const cargo = limpiarTexto(valorExcel);

  const equivalencias = {
    secretario: "Secretario(a)",
    secretaria: "Secretario(a)",
    tesorero: "Tesorero(a)",
    tesorera: "Tesorero(a)",
    director: "Director(a)",
    directora: "Director(a)",
  };

  const clave = normalizarComparacion(cargo);

  if (equivalencias[clave]) {
    return equivalencias[clave];
  }

  return buscarValorValido(cargo, CARGOS);
};

/* =========================
   IMPORTACIÓN
========================= */

const importar = async () => {
  const archivo = path.join(__dirname, "../archivos/gremios.xlsx");

  const workbook = XLSX.readFile(archivo);
  const hoja = workbook.Sheets[workbook.SheetNames[0]];

  const filas = XLSX.utils.sheet_to_json(hoja, {
    defval: "",
  });

  let gremiosCreados = 0;
  let integrantesCreados = 0;
  let duplicados = 0;
  let errores = 0;

  const rubrosInvalidos = new Set();
  const regionesInvalidas = new Set();
  const cargosInvalidos = new Set();

  try {
    await sequelize.authenticate();

    console.log("✅ Conexión a la base de datos correcta");
    console.log(`📄 Filas encontradas: ${filas.length}`);
    console.log("");

    for (let index = 0; index < Math.min(filas.length, 3); index++) {
      const fila = filas[index];
      const numeroFila = index + 2;

      const nombreGremio = limpiarTexto(fila["Gremio"]);
      const descripcion = limpiarTexto(fila["Descripción"]);
      const regionExcel = limpiarTexto(fila["Multigremial/REGIÓN"]);
      const rubroExcel = limpiarTexto(fila["Rubro"]);

      const nombrePersona = limpiarTexto(fila["Nombre"]);
      const apellidoPersona = limpiarTexto(fila["Apellido"]);
      const cargoExcel = limpiarTexto(fila["Cargo"]);
      const correo = limpiarTexto(fila["Mail"]);
      const telefono = limpiarTexto(fila["Fono"]);

      if (!nombreGremio) {
        console.log(`⚠️ Fila ${numeroFila}: sin nombre de gremio, se omite`);
        errores++;
        continue;
      }

      const regionValida = obtenerRegion(regionExcel);
      const rubroValido = obtenerRubro(rubroExcel);
      const cargoValido = obtenerCargo(cargoExcel);

      if (!regionValida) {
        regionesInvalidas.add(regionExcel || "(vacía)");
        console.log(
          `❌ Fila ${numeroFila}: región inválida "${regionExcel}"`
        );
        errores++;
        continue;
      }

      if (!rubroValido) {
        rubrosInvalidos.add(rubroExcel || "(vacío)");
        console.log(
          `❌ Fila ${numeroFila}: rubro inválido "${rubroExcel}"`
        );
        errores++;
        continue;
      }

      if (cargoExcel && !cargoValido) {
        cargosInvalidos.add(cargoExcel);
        console.log(
          `❌ Fila ${numeroFila}: cargo inválido "${cargoExcel}"`
        );
        errores++;
        continue;
      }

      const gremioExistente = await Gremio.findOne({
        where: {
          nombre: {
            [Op.like]: nombreGremio,
          },
        },
      });

      if (gremioExistente) {
        console.log(
          `⚠️ Fila ${numeroFila}: "${nombreGremio}" ya existe`
        );
        duplicados++;
        continue;
      }

      const transaccion = await sequelize.transaction();

      try {
        const gremio = await Gremio.create(
          {
            nombre: nombreGremio,
            rut: null,
            rubro: rubroValido,
            region: regionValida,
            descripcion: descripcion || null,
            logoUrl: null,
            cartaPdfUrl: null,
            fechaCreacion: null,
            numeroSocios: null,
            numeroEmpresas: null,
            provincia: null,
            ciudad: null,
            direccion: null,
            sitioWeb: null,
            email: null,
            redesSociales: null,
            estado: "aprobado",
          },
          {
            transaction: transaccion,
          }
        );

        const nombreCompleto = `${nombrePersona} ${apellidoPersona}`.trim();

        if (nombreCompleto) {
          await Integrante.create(
            {
              nombre: nombreCompleto,
              telefono: telefono || null,
              correo: correo || null,
              cargo: cargoValido || "Miembro",
              fotoUrl: null,
              gremioId: gremio.id,
            },
            {
              transaction: transaccion,
            }
          );

          integrantesCreados++;
        }

        await transaccion.commit();

        gremiosCreados++;

        console.log(
          `✅ Fila ${numeroFila}: creado "${nombreGremio}"`
        );
      } catch (error) {
        await transaccion.rollback();

        errores++;

        console.error(
          `❌ Fila ${numeroFila}: error creando "${nombreGremio}"`
        );

        console.error(error.message);
      }
    }

    console.log("");
    console.log("==================================");
    console.log("RESUMEN DE IMPORTACIÓN");
    console.log("==================================");
    console.log(`✅ Gremios creados: ${gremiosCreados}`);
    console.log(`✅ Integrantes creados: ${integrantesCreados}`);
    console.log(`⚠️ Duplicados omitidos: ${duplicados}`);
    console.log(`❌ Filas con errores: ${errores}`);

    if (regionesInvalidas.size > 0) {
      console.log("");
      console.log("Regiones inválidas:");
      console.log([...regionesInvalidas]);
    }

    if (rubrosInvalidos.size > 0) {
      console.log("");
      console.log("Rubros inválidos:");
      console.log([...rubrosInvalidos]);
    }

    if (cargosInvalidos.size > 0) {
      console.log("");
      console.log("Cargos inválidos:");
      console.log([...cargosInvalidos]);
    }
  } catch (error) {
    console.error("❌ Error general de importación:");
    console.error(error);
  } finally {
    await sequelize.close();
  }
};

importar();