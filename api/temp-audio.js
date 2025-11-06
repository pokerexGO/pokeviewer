import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { file } = req.query;
    if (!file) {
      return res.status(400).send("Falta el nombre del archivo");
    }

    const filePath = path.join("/tmp", file);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("Archivo no encontrado");
    }

    const audioBuffer = fs.readFileSync(filePath);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error("Error al servir archivo temporal:", err);
    res.status(500).send("Error interno al servir el audio");
  }
}
