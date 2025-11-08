import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    // 🔧 Configurar Cloudinary con tus variables de entorno
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    // 🎙️ Llamar a UnrealSpeech para generar el audio
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Will",
        Bitrate: "192k",
        Speed: "1.0",
        Codec: "libmp3lame",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en UnrealSpeech: ${errorText}`);
    }

    // 🔄 Convertir respuesta a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ☁️ Subir a Cloudinary directamente desde el buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video", // Cloudinary maneja MP3 como "video"
          folder: "temp-audios",
          public_id: `voz-${Date.now()}`,
          format: "mp3",
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    const publicUrl = uploadResult.secure_url;
    console.log("✅ Audio subido a Cloudinary:", publicUrl);

    // 🕒 Programar eliminación automática después de 2 minutos
    setTimeout(async () => {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: "video",
        });
        console.log("🗑️ Audio eliminado de Cloudinary:", uploadResult.public_id);
      } catch (deleteError) {
        console.error("⚠️ Error al eliminar audio automáticamente:", deleteError);
      }
    }, 2 * 60 * 1000); // 2 minutos

    // 🔗 Enviar la URL pública
    res.status(200).json({ success: true, url: publicUrl });

  } catch (error) {
    console.error("❌ Error en /api/audio:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar el audio.",
      details: error.message,
    });
  }
}
