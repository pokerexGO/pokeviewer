import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

// Configurar Cloudinary (usa tus credenciales .env)
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

    // 🔊 --- Generar voz con UnrealSpeech ---
    console.log("🎤 [API] Enviando texto a UnrealSpeech...");

    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Danielle", // puedes cambiar la voz aquí
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

    const audioBuffer = await unrealResponse.arrayBuffer();
    console.log("✅ [API] Audio recibido desde UnrealSpeech. Tamaño:", audioBuffer.byteLength, "bytes");

    // ⚠️ Comprobar duración mínima (evitar audios de 0 segundos)
    if (audioBuffer.byteLength < 5000) {
      console.warn("⚠️ [API] Audio demasiado corto. Puede estar vacío o falló la generación.");
      return res.status(500).json({
        success: false,
        error: "El audio generado es demasiado corto o vacío.",
      });
    }

    // ☁️ --- Subir a Cloudinary ---
    console.log("☁️ [API] Subiendo audio a Cloudinary...");

    const cloudinaryUpload = await cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // video para permitir archivos MP3
        folder: "temp-audios",
        public_id: `voz-${Date.now()}`,
        format: "mp3",
      },
      (error, result) => {
        if (error) {
          console.error("❌ [API] Error al subir a Cloudinary:", error);
          return res.status(500).json({
            success: false,
            error: "Fallo al subir el audio a Cloudinary",
            details: error.message,
          });
        }

        console.log("✅ [API] Audio subido correctamente a Cloudinary:", result.secure_url);
        res.status(200).json({
          success: true,
          url: result.secure_url,
        });
      }
    );

    // Escribir el buffer en el stream de Cloudinary
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(audioBuffer));
        controller.close();
      },
    });

    const reader = readable.getReader();
    const stream = cloudinaryUpload;
    const writer = stream.writable.getWriter();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
    }
    writer.close();

  } catch (err) {
    console.error("💥 [API] Error general:", err);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}
