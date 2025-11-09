import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import { Readable } from "stream";

// Configuración Cloudinary
cloudinary.config({
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
    return res.status(400).json({ success: false, error: "Texto vacío" });
  }

  try {
    // Llamada a UnrealSpeech (endpoint /speech)
    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Amy",
        Bitrate: "192k",
        Speed: 1.0,
        Pitch: 1.0,
        Format: "mp3",
      }),
    });

    if (!unrealResponse.ok) {
      const errorText = await unrealResponse.text();
      return res.status(500).json({ success: false, error: "Error UnrealSpeech API", details: errorText });
    }

    const audioBuffer = Buffer.from(await unrealResponse.arrayBuffer());

    if (audioBuffer.byteLength < 5000) {
      // Aunque el audio sea muy corto, se puede subir
      console.warn("⚠️ Audio muy corto, se subirá de todos modos.");
    }

    // Subir a Cloudinary con resource_type auto
    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "temp-audios",
            public_id: `voz-${Date.now()}`,
            resource_type: "auto", // 🔹 Detecta automáticamente audio/mp3
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(audioBuffer).pipe(stream);
      });

    const result = await uploadStream();

    // Respuesta exitosa
    res.status(200).json({ success: true, url: result.secure_url, bytes: audioBuffer.byteLength });
  } catch (err) {
    res.status(500).json({ success: false, error: "Error general en el servidor", details: err.message });
  }
}
