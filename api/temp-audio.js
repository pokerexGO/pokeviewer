import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const { file } = req.query;

    if (!file) {
      res.status(400).send("No se especificó el archivo.");
      return;
    }

    const filepath = path.join("/tmp", file);

    if (!fs.existsSync(filepath)) {
      res.status(404).send("Archivo no encontrado.");
      return;
    }

    // Establecer cabeceras para que se pueda reproducir en AppCreator24
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `inline; filename="${file}"`);

    const stream = fs.createReadStream(filepath);
    stream.pipe(res);

    stream.on("error", (err) => {
      console.error("Error al leer el archivo MP3:", err);
      res.status(500).send("Error al leer el archivo MP3.");
    });
  } catch (err) {
    console.error("Error en temp-audio.js:", err);
    res.status(500).send("Error interno del servidor.");
  }
}
