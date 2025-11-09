import fetch from "node-fetch";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

dotenv.config();

// Configuración Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para generar audio
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { texto } = req.body;
  if (!texto) {
    return res.status(400).json({ success: false, error: "No se proporcionó texto" });
  }

  try {
    // 1️⃣ Solicitar audio completo a UnrealSpeech
    const unrealResp = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.UNREAL_API_KEY
      },
      body: JSON.stringify({
        text: texto,
        voice: "Amy",  // voz Amy compatible
        format: "mp3"
      })
    });

    if (!unrealResp.ok) {
      const errorText = await unrealResp.text();
      return res.status(500).json({ success: false, error: "Error en UnrealSpeech API", details: errorText });
    }

    // 2️⃣ Descargar todo el audio a buffer
    const audioBuffer = Buffer.from(await unrealResp.arrayBuffer());

    if (audioBuffer.length < 500) { // mínimo 0.5 KB para no considerar vacío
      return res.status(200).json({ success: false, error: "El audio generado es demasiado corto o vacío.", bytes: audioBuffer.length });
    }

    // 3️⃣ Guardar temporalmente
    const tempFile = path.join(process.cwd(), "temp-audio.mp3");
    fs.writeFileSync(tempFile, audioBuffer);

    // 4️⃣ Subir a Cloudinary
    const uploadResp = await cloudinary.v2.uploader.upload(tempFile, {
      resource_type: "auto",
      folder: "temp-audios",
      use_filename: true,
      unique_filename: true,
      overwrite: true
    });

    // 5️⃣ Borrar temporal
    fs.unlinkSync(tempFile);

    // 6️⃣ Responder con la URL final
    res.status(200).json({
      success: true,
      url: uploadResp.secure_url,
      bytes: audioBuffer.length
    });

  } catch (err) {
    console.error("💥 Error general:", err);
    res.status(500).json({ success: false, error: "Error general en el servidor", details: err.message });
  }
}
