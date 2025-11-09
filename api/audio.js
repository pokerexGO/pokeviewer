import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();

// 🔧 Configuración Cloudinary
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

    // --- Generar audio completo desde UnrealSpeech ---
    console.log("🎤 [API] Solicitando audio completo a UnrealSpeech...");

    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Amy", // voz funcional
        Format: "mp3",
        Bitrate: "192k",
        Speed: 1.0,
        Pitch: 1.0
      }),
    });

    if (!unrealResponse.ok) {
      const errText = await unrealResponse.text();
      console.error("❌ [API] Error UnrealSpeech:", errText);
      return res.status(500).json({
        success: false,
        error: "Error en UnrealSpeech API",
        details: errText,
      });
    }

    // 🔹 Obtener buffer completo
    const audioBuffer = Buffer.from(await unrealResponse.arrayBuffer());
    console.log("✅ [API] Audio recibido. Tamaño:", audioBuffer.byteLength, "bytes");

    if (audioBuffer.byteLength < 100) {
      console.warn("⚠️ [API] Audio demasiado corto, pero se devolverá igual");
    }

    // --- Subir a Cloudinary ---
    console.log("☁️ [API] Subiendo a Cloudinary...");
    const uploadResult = await cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder: "temp-audios", format: "mp3", public_id: `voz-${Date.now()}` },
      (error, result) => {
        if (error) {
          console.error("❌ [API] Error al subir a Cloudinary:", error);
          return res.status(500).json({ success: false, error: "Error subiendo a Cloudinary", details: error.message });
        }
        console.log("✅ [API] Audio subido:", result.secure_url);

        // ✅ Responder al frontend
        return res.status(200).json({ success: true, url: result.secure_url, bytes: audioBuffer.byteLength });
      }
    );

    // 🔹 Pipe buffer al uploader
    uploadResult.end(audioBuffer);

  } catch (err) {
    console.error("💥 [API] Error general:", err);
    return res.status(500).json({ success: false, error: "Error general en el servidor", details: err.message });
  }
}
