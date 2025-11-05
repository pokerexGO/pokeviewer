// api/tts.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: "Se requiere texto para TTS" });
    return;
  }

  try {
    // ⚡ API de TTS (ejemplo UnrealSpeech)
    const apiKey = process.env.UNREAL_TTS_KEY; // tu clave en Vercel
    const ttsResp = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        text,
        voiceId: "Amy", // puedes cambiar a "Scarlett" si quieres
        format: "mp3"
      })
    });

    if (!ttsResp.ok) throw new Error("Error al generar audio TTS");

    const audioBuffer = await ttsResp.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo generar el audio" });
  }
}
