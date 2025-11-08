import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import { Readable } from "stream";

// Configurar Cloudinary con tus variables .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Endpoint principal
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
    console.log("🎤 [API] Enviando texto a UnrealSpeech...");

    // 🔊 Generar voz con UnrealSpeech
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
      console.error("❌ [API] Error al contactar UnrealSpeech:", errorText);
      return res.status(500).json({
        success: false,
        error: "Error en UnrealSpeech API",
        details: errorText,
      });
    }

    const audioBuffer = Buffer.from(await unrealResponse.arrayBuffer());
    console.log("✅ [API] Audio recibido. Tamaño:", audioBuffer.length, "bytes");

    // Si el audio está vacío o corrupto
    if (audioBuffer.length < 5000) {
      console.warn("⚠️ [API] Audio demasiado corto. Puede estar vacío.");
      return res.status(500).json({
        success: false,
        error: "El audio generado es demasiado corto o vacío.",
      });
    }

    // ☁️ Subir a Cloudinary
    console.log("☁️ [API] Subiendo audio a Cloudinary...");

    // Convertir el buffer en un stream legible de Node
    const bufferStream = new Readable();
    bufferStream.push(audioBuffer);
    bufferStream.push(null);

    // Subir usando upload_stream con promesa
    const result = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "temp-audios",
          public_id: `voz-${Date.now()}`,
          format: "mp3",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      bufferStream.pipe(upload);
    });

    console.log("✅ [API] Audio subido correctamente a Cloudinary:", result.secure_url);

    res.status(200).json({
      success: true,
      url: result.secure_url,
    });

  } catch (err) {
    console.error("💥 [API] Error general:", err);
    res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}
