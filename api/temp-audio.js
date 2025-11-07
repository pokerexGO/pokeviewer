import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({ error: "No se proporcionó nombre de archivo." });
    }

    const filePath = path.join(process.cwd(), "public", "temp", file);

    console.log("📂 Solicitando archivo:", filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ Archivo no encontrado:", filePath);
      return res.status(404).json({ error: "Archivo no encontrado." });
    }

    // Configurar cabeceras de audio
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Leer y enviar el archivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log("✅ Archivo de audio enviado:", file);

  } catch (error) {
    console.error("💥 Error en /api/temp-audio:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
}
