import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      res.status(400).json({ error: "No se proporcionó texto para TTS" });
      return;
    }

    // Llamada a UnrealSpeech
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
        Codec: "libmp3lame", // formato correcto
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en UnrealSpeech: ${errorText}`);
    }

    // Guardar el audio temporalmente en /tmp (Vercel lo permite)
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `voz-${Date.now()}.mp3`;
    const tempDir = path.join("/tmp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, buffer);

    // URL pública accesible desde AppCreator24
    const publicUrl = `https://${req.headers.host}/api/temp-audio?file=${filename}`;

    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error("Error en proxy UnrealSpeech:", error);
    res.status(500).json({ error: "Error al conectar con UnrealSpeech" });
  }
}
