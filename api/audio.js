import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

// --- CONFIGURACIÓN CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- ENDPOINT PRINCIPAL ---
export default async function handler(req, res) {
  console.log("📩 [API] Petición recibida en /api/audio");

  if (req.method !== "POST") {
    console.error("❌ [API] Método no permitido:", req.method);
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;
    if (!texto || texto.trim().length === 0) {
      console.error("⚠️ [API] Texto vacío o inválido recibido.");
      return res.status(400).json({ success: false, error: "No se proporcionó texto válido." });
    }

    console.log("🧠 [API] Texto recibido:", texto);

    // --- UNREALSPEECH ---
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
      let errorData;
      try {
        errorData = await unrealResponse.json();
      } catch {
        errorData = await unrealResponse.text();
      }

      console.error("❌ [API] Error al contactar UnrealSpeech:", errorData);
      return res.status(500).json({
        success: false,
        error: "Error en UnrealSpeech API",
        details: errorData,
      });
    }

    const audioBuffer = await unrealResponse.arrayBuffer();
    console.log("✅ [API] Audio recibido desde UnrealSpeech. Tamaño:", audioBuffer.byteLength, "bytes");

    if (audioBuffer.byteLength < 5000) {
      console.warn("⚠️ [API] Audio demasiado corto. Puede estar vacío o falló la generación.");
      return res.status(500).json({
        success: false,
        error: "El audio generado es demasiado corto o vacío.",
      });
    }

    // --- SUBIR A CLOUDINARY ---
    console.log("☁️ [API] Subiendo audio a Cloudinary...");

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "temp-audios",
          public_id: `voz-${Date.now()}`,
          format: "mp3",
        },
        (error, result) => {
          if (error) {
            console.error("❌ [API] Error al subir a Cloudinary:", error);
            reject(error);
          } else {
            console.log("✅ [API] Audio subido correctamente a Cloudinary:", result.secure_url);
            resolve(result);
          }
        }
      );

      const buffer = Buffer.from(audioBuffer);
      uploadStream.end(buffer);
    });

    const cloudinaryResult = await uploadPromise;

    res.status(200).json({
      success: true,
      url: cloudinaryResult.secure_url,
    });
  } catch (err) {
    console.error("💥 [API] Error general:", err);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}
