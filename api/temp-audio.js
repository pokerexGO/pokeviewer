// api/temp-audio.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { filename, audioData } = req.body;
  if (!filename || !audioData) {
    res.status(400).json({ error: "Se requiere filename y audioData" });
    return;
  }

  try {
    // Carpeta temporal dentro de /tmp (Vercel permite escribir en /tmp)
    const tempDir = path.join("/tmp", "audio");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const filePath = path.join(tempDir, filename);

    // audioData debe ser base64
    const buffer = Buffer.from(audioData, "base64");
    fs.writeFileSync(filePath, buffer);

    res.status(200).json({ success: true, url: `/tmp/audio/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo guardar el audio temporalmente" });
  }
}
