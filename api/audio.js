import fetch from "node-fetch";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  console.log("📩 Petición recibida en /api/audio");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  const { texto } = req.body;

  if (!texto || texto.trim() === "") {
    return res.status(400).json({ success: false, error: "No se proporcionó texto válido." });
  }

  try {
    // --- Solicitar audio completo a UnrealSpeech ---
    const unrealRes = await fetch("https://api.v7.unrealspeech.com/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Amy", // voz que funciona
        Format: "mp3",
        Bitrate: "192k",
      }),
    });

    if (!unrealRes.ok) {
      const errText = await unrealRes.text();
      console.error("❌ Error UnrealSpeech:", errText);
      return res.status(500).json({ success: false, error: "Error en UnrealSpeech API", details: errText });
    }

    const audioBuffer = Buffer.from(await unrealRes.arrayBuffer());

    if (audioBuffer.length < 1000) {
      console.warn("⚠️ Audio muy corto:", audioBuffer.length, "bytes");
      // Permitimos reproducir aunque sea corto
    }

    // --- Subir a Cloudinary como RAW ---
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "temp-audios",
          public_id: `voz-${Date.now()}`,
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      Readable.from(audioBuffer).pipe(stream);
    });

    console.log("✅ Audio subido a Cloudinary:", uploadResult.secure_url);

    return res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      bytes: audioBuffer.length,
    });

  } catch (err) {
    console.error("💥 Error general:", err);
    return res.status(500).json({ success: false, error: "Error general en el servidor", details: err.message });
  }
}
