import fetch from "node-fetch";
import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

// 🔐 Configuración de Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  console.log("📢 Solicitud recibida en /api/audio");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { text, voice = "Liv" } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: "Texto faltante" });
  }

  try {
    console.log("🎤 Generando audio con UnrealSpeech...");

    // ✅ Se usa /speak para obtener el audio completo (no stream)
    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speak", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_SPEECH_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: voice, // Ej: Liv, Amy, Dan, Will, Scarlett
        Format: "mp3",
        Bitrate: "192k",
        Speed: 0,
        Pitch: 1.0,
      }),
    });

    if (!unrealResponse.ok) {
      const errorText = await unrealResponse.text();
      console.error("❌ Error en UnrealSpeech API:", errorText);
      return res.status(500).json({
        success: false,
        error: "Error en UnrealSpeech API",
        details: errorText,
      });
    }

    // 🔊 Convertimos el audio en buffer completo (no stream)
    const audioBuffer = await unrealResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer);

    // 📦 Subimos a Cloudinary (almacenamiento temporal)
    console.log("☁️ Subiendo audio a Cloudinary...");
    const uploadResult = await cloudinary.v2.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "temp-audios",
        public_id: `voz-${Date.now()}`,
        format: "mp3",
      },
      (error, result) => {
        if (error) {
          console.error("❌ Error al subir a Cloudinary:", error);
          return res.status(500).json({
            success: false,
            error: "Error al subir audio a Cloudinary",
          });
        }

        console.log("✅ Audio subido con éxito:", result.secure_url);
        return res.status(200).json({
          success: true,
          url: result.secure_url,
          bytes: audioBase64.length,
        });
      }
    );

    // ⏳ Escribimos el audio en el flujo de subida
    uploadResult.end(audioBase64);

    // 🚮 Eliminar automáticamente de Cloudinary tras 2 minutos
    setTimeout(async () => {
      try {
        const publicId = `temp-audios/voz-${Date.now()}`;
        await cloudinary.v2.uploader.destroy(publicId, { resource_type: "video" });
        console.log(`🧹 Audio eliminado de Cloudinary: ${publicId}`);
      } catch (e) {
        console.warn("⚠️ Error al eliminar el audio:", e.message);
      }
    }, 120000);

  } catch (error) {
    console.error("❌ Error general en el servidor:", error);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: error.message,
    });
  }
}
