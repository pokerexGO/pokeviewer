import fetch from "node-fetch";
import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

// ✅ Configuración de Cloudinary
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

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: "Texto faltante o vacío" });
  }

  if (!process.env.UNREAL_API_KEY) {
    console.error("🚨 Falta la clave UNREAL_API_KEY en el .env");
    return res.status(500).json({ success: false, error: "Falta la clave de UnrealSpeech" });
  }

  try {
    console.log("🎤 Enviando texto a UnrealSpeech...");

    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speak", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: voice,
        Format: "mp3",
        Bitrate: "192k",
        Speed: 0,
        Pitch: 1.0,
      }),
    });

    // ⚠️ Verificamos si UnrealSpeech devuelve un error no audio
    const contentType = unrealResponse.headers.get("content-type") || "";
    if (!contentType.includes("audio") && !contentType.includes("octet-stream") && !unrealResponse.ok) {
      const errorText = await unrealResponse.text();
      console.error("❌ Respuesta no válida de UnrealSpeech:", errorText);
      return res.status(500).json({
        success: false,
        error: "Error en UnrealSpeech API",
        details: errorText,
      });
    }

    // 🎧 Obtenemos el audio en binario y convertimos a Buffer
    const audioBuffer = await unrealResponse.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(audioBuffer));

    // 📦 Subimos el audio a Cloudinary
    console.log("☁️ Subiendo audio a Cloudinary...");
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "temp-audios",
          public_id: `voz-${Date.now()}`,
          format: "mp3",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    console.log("✅ Audio subido con éxito:", upload.secure_url);

    // ⏳ Eliminar tras 2 minutos
    setTimeout(async () => {
      try {
        await cloudinary.v2.uploader.destroy(upload.public_id, { resource_type: "auto" });
        console.log(`🧹 Audio eliminado: ${upload.public_id}`);
      } catch (e) {
        console.warn("⚠️ No se pudo eliminar el audio:", e.message);
      }
    }, 120000);

    return res.status(200).json({
      success: true,
      url: upload.secure_url,
      bytes: buffer.length,
    });

  } catch (error) {
    console.error("💥 Error general:", error);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: error.message,
    });
  }
}
