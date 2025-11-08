import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import stream from "stream";
import { promisify } from "util";

// Convertir funciones de callback a promesas
const pipeline = promisify(stream.pipeline);

// Configurar Cloudinary con tus variables .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  console.log("📩 [API] Petición recibida en /api/audio");

  if (req.method !== "POST") {
    console.error("❌ [API] Método no permitido:", req.method);
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length === 0) {
      console.error("⚠️ [API] Texto vacío o inválido.");
      return res.status(400).json({ success: false, error: "No se proporcionó texto válido." });
    }

    console.log("🧠 [API] Texto recibido:", texto);

    // --- Generar voz con UnrealSpeech ---
    console.log("🎤 [API] Enviando texto a UnrealSpeech...");

    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Danielle",
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

    console.log("✅ [API] Audio recibido desde UnrealSpeech. Subiendo a Cloudinary...");

    // --- Subir el audio a Cloudinary directamente desde el stream ---
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // Cloudinary requiere 'video' para MP3
        folder: "temp-audios",
        public_id: `voz-${Date.now()}`,
        format: "mp3",
      },
      async (error, result) => {
        if (error) {
          console.error("❌ [API] Error al subir a Cloudinary:", error);
          return res.status(500).json({
            success: false,
            error: "Fallo al subir el audio a Cloudinary",
            details: error.message,
          });
        }

        console.log("✅ [API] Audio subido correctamente:", result.secure_url);

        // --- Programar eliminación en 2 minutos ---
        const publicId = result.public_id;
        console.log(`🕒 [API] Programando eliminación de ${publicId} en 2 minutos...`);

        setTimeout(async () => {
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
            console.log(`🧹 [API] Audio eliminado automáticamente: ${publicId}`);
          } catch (err) {
            console.error("⚠️ [API] Error al eliminar automáticamente:", err);
          }
        }, 2 * 60 * 1000); // 2 minutos

        // Responder al frontend
        res.status(200).json({
          success: true,
          url: result.secure_url,
        });
      }
    );

    // --- Enviar el stream de UnrealSpeech directamente a Cloudinary ---
    await pipeline(unrealResponse.body, uploadStream);

  } catch (err) {
    console.error("💥 [API] Error general:", err);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}
