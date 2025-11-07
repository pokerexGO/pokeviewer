import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { file } = req.query;
    if (!file) return res.status(400).send("Falta el nombre del archivo.");

    const filePath = path.join("/tmp", file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Archivo no encontrado.");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error("💥 Error al servir audio temporal:", err);
    res.status(500).send("Error interno del servidor.");
  }
}
