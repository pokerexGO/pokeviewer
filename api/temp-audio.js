// api/temp-audio.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { file } = req.query;
    if (!file) return res.status(400).send("Archivo no especificado.");

    const filePath = path.join("/tmp", file);
    if (!fs.existsSync(filePath)) return res.status(404).send("Archivo no encontrado.");

    const buffer = fs.readFileSync(filePath);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al servir el audio.");
  }
}
