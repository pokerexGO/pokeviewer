import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  console.log("📩 [API] Petición recibida en /api/audio");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({ success: false, error: "No se proporcionó texto válido." });
    }

    console.log("🧠 [API] Texto recibido:", texto);

    const voz = "Amy";
    console.log(`🎤 [API] Generando voz con UnrealSpeech (${voz})...`);

    // ✅ Descargar todo el audio antes de subirlo
    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: voz,
        Bitrate: "192k",
        Speed: 1.0,
        Pitch: 1.0,
        Format: "mp3",
      }),
    });

    if (!unrealResponse.ok) {
      const errorText = await unrealResponse.text();
      console.error("❌ [API] Error UnrealSpeech:", errorText);
      return res.status(500).json({
        success: false,
        error: "Error en UnrealSpeech API",
        details: errorText,
      });
    }

    // 🔽 Descargar el audio completo en buffer
    const arrayBuffer = await unrealResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`🎧 [API] Audio descargado (${buffer.length} bytes)`);

    if (buffer.length < 1000) {
      console.warn("⚠️ [API] El archivo de audio parece estar vacío o incompleto.");
    }

    // ☁️ Subir el buffer a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "temp-audios", format: "mp3" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    console.log("✅ [API] Audio subido correctamente:", result.secure_url);

    // 🕒 Eliminar en 2 minutos
    setTimeout(async () => {
      try {
        await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
        console.log(`🧹 [API] Audio eliminado automáticamente: ${result.public_id}`);
      } catch (err) {
        console.error("⚠️ [API] Error al eliminar automáticamente:", err);
      }
    }, 2 * 60 * 1000);

    res.status(200).json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error("💥 [API] Error general:", err);
    res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}
