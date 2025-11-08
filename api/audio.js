import { v2 as cloudinary } from "cloudinary";

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, error: "No se proporcionó texto para el TTS." });
    }

    console.log("🌀 Generando audio con UnrealSpeech...");

    // Llamada a UnrealSpeech API
    const unrealResp = await fetch("https://api.v7.unrealspeech.com/stream", {
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

    if (!unrealResp.ok) {
      const errText = await unrealResp.text();
      console.error("❌ Error UnrealSpeech:", errText);
      return res.status(500).json({ success: false, error: "Error UnrealSpeech", details: errText });
    }

    // Convertir la respuesta a Buffer (audio MP3)
    const arrayBuffer = await unrealResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("📦 Audio recibido de UnrealSpeech:", buffer.length, "bytes");

    if (buffer.length < 1000) {
      return res.status(500).json({
        success: false,
        error: "Audio vacío o corrupto recibido de UnrealSpeech",
      });
    }

    // Subir a Cloudinary (como video para MP3)
    console.log("☁️ Subiendo a Cloudinary...");
    const uploadResp = await cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "temp-audios",
        format: "mp3",
        public_id: `voz-${Date.now()}`,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Error al subir a Cloudinary:", error);
          return res.status(500).json({ success: false, error: "Error al subir a Cloudinary", details: error });
        }

        console.log("✅ Subida exitosa:", result.secure_url);
        return res.status(200).json({ success: true, url: result.secure_url });
      }
    );

    // Escribir buffer en el flujo (upload_stream)
    const stream = uploadResp;
    stream.end(buffer);

  } catch (error) {
    console.error("💥 Error general en /api/audio:", error);
    res.status(500).json({ success: false, error: "Error general en el servidor", details: error.message });
  }
}
