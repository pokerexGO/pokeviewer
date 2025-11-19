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
  console.log("🎙️ Endpoint /api/audio invocado...");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Texto vacío o inválido" });
    }

    console.log("🎙️ Texto recibido:", text);

    // 🔹 Paso 1: Solicitud a UnrealSpeech (versión v7)
    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Amy", // ✅ Voz solicitada
        Codec: "mp3",
        Speed: 0,
        Pitch: 1,
      }),
    });

    const data = await unrealResponse.json();
    console.log("📦 Respuesta UnrealSpeech:", data);

    // ⚠️ Si UnrealSpeech devuelve error
    if (!data.OutputUri) {
      return res.status(500).json({
        success: false,
        error: "No se recibió OutputUri de UnrealSpeech",
        details: data,
      });
    }

    // 🔹 Paso 2: Descargar el MP3 generado
    const audioResponse = await fetch(data.OutputUri);
    const audioBuffer = await audioResponse.arrayBuffer();

    const audioBytes = Buffer.byteLength(Buffer.from(audioBuffer));
    console.log(`📏 Tamaño del audio descargado: ${audioBytes} bytes (${(audioBytes / 1024).toFixed(2)} KB)`);

    if (audioBytes < 2000) {
      return res.status(500).json({
        success: false,
        error: "El audio generado es demasiado corto o vacío.",
        bytes: audioBytes,
      });
    }

    // 🔹 Paso 3: Subir a Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "tts_audio",
          public_id: `tts_${Date.now()}`,
          format: "mp3",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(Buffer.from(audioBuffer));
    });

    console.log("✅ Subida exitosa a Cloudinary:", uploadResult.secure_url);

    // 🔹 Paso 4: Responder al frontend
    return res.status(200).json({
      success: true,
      audioUrl: uploadResult.secure_url,
      bytes: audioBytes,
      unrealSpeechTask: data.TaskId || null,
    });

  } catch (error) {
    console.error("💥 Error general en el backend:", error);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: error.message || error.toString(),
    });
  }
}
