// ✅ audio.js — versión con control de tamaño y depuración visible
import fetch from "node-fetch";
import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

// ✅ Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Endpoint principal /api/audio
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;
    if (!texto) {
      return res.status(400).json({ success: false, error: "No se envió texto." });
    }

    console.log("🎙️ Texto recibido:", texto);

    // 1️⃣ Solicitud a UnrealSpeech
    const unrealRes = await fetch("https://api.v6.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Amy",
        Format: "mp3",
        Bitrate: "192k",
        Speed: 1.0,
        Pitch: 1.0,
      }),
    });

    const unrealJson = await unrealRes.json();
    console.log("📦 Respuesta UnrealSpeech:", unrealJson);

    if (!unrealJson.OutputUri) {
      throw new Error("No se recibió OutputUri desde UnrealSpeech.");
    }

    // 2️⃣ Descargar el archivo MP3 desde OutputUri
    const audioFetch = await fetch(unrealJson.OutputUri);
    const audioBuffer = await audioFetch.arrayBuffer();

    const sizeBytes = audioBuffer.byteLength;
    const sizeKB = (sizeBytes / 1024).toFixed(2);
    console.log(`📏 Tamaño del audio descargado: ${sizeBytes} bytes (${sizeKB} KB)`);

    // Validar tamaño del audio
    if (sizeBytes < 1000) {
      return res.status(400).json({
        success: false,
        error: "El audio generado es demasiado corto o vacío.",
        bytes: sizeBytes,
      });
    }

    // 3️⃣ Subir a Cloudinary
    const uploadRes = await cloudinary.v2.uploader.upload_stream(
      {
        resource_type: "auto", // ✅ Permite mp3 sin confundirlo con video
        folder: "tts_audio",
        public_id: `tts_${Date.now()}`,
      },
      (error, result) => {
        if (error) {
          console.error("💥 Error al subir a Cloudinary:", error);
          return res.status(500).json({
            success: false,
            error: "Error al subir a Cloudinary",
            details: error.message,
          });
        }

        console.log("✅ Subida exitosa a Cloudinary:", result.secure_url);

        return res.status(200).json({
          success: true,
          url: result.secure_url,
          bytes: sizeBytes,
          sizeKB,
          voice: "Amy",
          unrealUri: unrealJson.OutputUri,
        });
      }
    );

    // 🧩 Escribir el buffer en el stream
    uploadRes.end(Buffer.from(audioBuffer));

  } catch (err) {
    console.error("💥 Error general:", err);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}

