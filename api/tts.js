// api/tts.js
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texto vacío" });

    const unrealKey = process.env.UNREAL_API_KEY;
    if (!unrealKey) return res.status(500).json({ error: "Falta la clave UnrealSpeech" });

    // Petición al servicio TTS
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${unrealKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Amy",
      }),
    });

    if (!response.ok) throw new Error("Error al generar audio UnrealSpeech");

    // Guardar el audio temporalmente
    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = `audio_${Date.now()}.mp3`;
    const filePath = path.join("/tmp", filename);
    fs.writeFileSync(filePath, buffer);

    // Retornar la URL del audio (Vercel sirve /tmp como archivo público temporal)
    const audioUrl = `https://${req.headers.host}/api/temp-audio?file=${filename}`;
    res.status(200).json({ url: audioUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
