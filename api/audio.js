import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

// 🔧 Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🗂️ Ruta principal del backend
export default async function handler(req, res) {
  console.log("📩 [API] Petición recibida en /api/audio");

  if (req.method !== "POST") {
    console.error("❌ [API] Método no permitido:", req.method);
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;

    if (!texto || texto.trim().length === 0) {
      console.warn("⚠️ [API] Texto vacío o inválido recibido.");
      return res.status(400).json({ success: false, error: "No se proporcionó texto válido." });
    }

    console.log("🧠 [API] Texto recibido:", texto);

    // --- GENERAR VOZ CON UNREALSPEECH ---
    console.log("🎤 [API] Solicitando voz a UnrealSpeech...");

    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Amy", // ✅ voz que funciona
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

    // 📦 Obtener el audio como buffer
    const audioBuffer = Buffer.from(await unrealResponse.arrayBuffer());
    console.log("✅ [API] Audio recibido. Tamaño:", audioBuffer.byteLength, "bytes");

    // --- SUBIR A CLOUDINARY ---
    console.log("☁️ [API] Subiendo a Cloudinary...");

    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto", // 🔹 Auto detecta el tipo
            folder: "temp-audios",
            public_id: `voz-${Date.now()}`,
            format: "mp3",
          },
          (error, result) => {
            if (error) {
              console.error("❌ [API] Error al subir a Cloudinary:", error);
              reject(error);
            } else {
              console.log("✅ [API] Audio subido:", result.secure_url);
              resolve(result);
            }
          }
        );
        Readable.from(audioBuffer).pipe(stream);
      });

    const result = await uploadStream();

    // --- ELIMINAR DESPUÉS DE 2 MINUTOS ---
    setTimeout(async () => {
      try {
        const publicId = result.public_id;
        console.log(`🕒 [API] Eliminando audio temporal: ${publicId}`);
        await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
        console.log(`✅ [API] Audio eliminado de Cloudinary: ${publicId}`);
      } catch (err) {
        console.error("⚠️ [API] Error al eliminar audio:", err.message);
      }
    }, 2 * 60 * 1000); // 2 minutos

    // ✅ RESPUESTA EXITOSA
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      bytes: audioBuffer.byteLength,
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
