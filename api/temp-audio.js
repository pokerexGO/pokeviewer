import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { file } = req.query;
    const filepath = path.join("/tmp", file);

    if (!fs.existsSync(filepath)) {
      return res.status(404).send("Archivo no encontrado");
    }

    const audioBuffer = fs.readFileSync(filepath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audioBuffer);
  } catch (error) {
    console.error("Error al servir audio temporal:", error);
    res.status(500).send("Error interno del servidor");
  }
}
