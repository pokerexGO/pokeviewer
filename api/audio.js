import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    console.log("🧠 Texto recibido para TTS:", text.slice(0, 80));

    // 🔹 Llamada a UnrealSpeech
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
      console.error("❌ Error UnrealSpeech:", errorText);
      return res.status(500).json({ error: "Error al conectar con UnrealSpeech." });
    }

    // 🔸 Guardar el MP3 en carpeta temporal (válida en Vercel)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempDir = "/tmp"; // ✅ Carpeta temporal
    const filename = `voz-${Date.now()}.mp3`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, buffer);

    console.log("✅ Archivo guardado temporalmente en:", filepath);

    // 🔹 Crear una URL pública que sirva el archivo
    const publicUrl = `/api/temp-audio?file=${filename}`;

    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error("💥 Error en proxy UnrealSpeech:", error);
    res.status(500).json({ error: "Error al generar el audio." });
  }
}
