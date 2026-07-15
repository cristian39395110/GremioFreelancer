const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadsDir = path.join(__dirname, "../uploads");
const logosDir = path.join(uploadsDir, "logos");
const cartasDir = path.join(uploadsDir, "cartas");
const integrantesDir = path.join(uploadsDir, "integrantes");

[uploadsDir, logosDir, cartasDir, integrantesDir].forEach((directorio) => {
  fs.mkdirSync(directorio, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "logo") {
      return cb(null, logosDir);
    }

    if (file.fieldname === "cartaAdhesion") {
      return cb(null, cartasDir);
    }

    if (file.fieldname.startsWith("integranteFoto")) {
      return cb(null, integrantesDir);
    }

    return cb(new Error("Campo de archivo no permitido"));
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const nombreUnico = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, nombreUnico);
  },
});

const fileFilter = (req, file, cb) => {
  const imagenesPermitidas = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (file.fieldname === "cartaAdhesion") {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("La carta de adhesión debe ser PDF"));
    }

    return cb(null, true);
  }

  if (
    file.fieldname === "logo" ||
    file.fieldname.startsWith("integranteFoto")
  ) {
    if (!imagenesPermitidas.includes(file.mimetype)) {
      return cb(new Error("La imagen debe ser JPG, PNG o WEBP"));
    }

    return cb(null, true);
  }

  return cb(new Error("Archivo no permitido"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;