import fetch from "node-fetch";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import { Readable } from "stream";

dotenv.config();

// Configuración Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { texto } = req.body;
  if (!texto || texto.trim().length === 0) {
    return res.status(400).json({ success: false, error: "No se recibió texto para generar audio" });
  }

  try {
    // --- Llamada a UnrealSpeech (endpoint /speech) ---
    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice: "Amy",       // voz que funciona
        input: texto,
        format: "mp3",      // pedimos MP3 completo
        sampleRate: 24000
      }),
    });

    if (!unrealResponse.ok) {
      const text = await unrealResponse.text();
      return res.status(500).json({ success: false, error: "Error en UnrealSpeech API", details: text });
    }

    // Descargar audio completo como buffer
    const audioBuffer = Buffer.from(await unrealResponse.arrayBuffer());

    if (audioBuffer.length < 1000) {
      // Para evitar audio demasiado corto
      return res.status(500).json({
        success: false,
        error: "El audio generado es demasiado corto o vacío",
        bytes: audioBuffer.length
      });
    }

    // Subir a Cloudinary (resource_type: "auto" para evitar errores de tipo)
    const uploadResult = await cloudinary.v2.uploader.upload_stream(
      { resource_type: "auto", folder: "temp-audios" },
      (error, result) => {
        if (error || !result) {
          return res.status(500).json({ success: false, error: "Error al subir a Cloudinary", details: error });
        }
        // Responder con URL y tamaño
        res.status(200).json({
          success: true,
          url: result.secure_url,
          bytes: audioBuffer.length
        });
      }
    );

    // Convertir buffer a stream y enviar a Cloudinary
    const readable = new Readable();
    readable._read = () => {};
    readable.push(audioBuffer);
    readable.push(null);
    readable.pipe(uploadResult);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error general en el servidor", details: err.message });
  }
}
