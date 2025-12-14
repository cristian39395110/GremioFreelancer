const jwt = require("jsonwebtoken");

module.exports = function autenticarAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id; // 👈 clave
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido" });
  }
};
