// api/tts.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Se requiere texto" });

  try {
    // Llamada a tu API de TTS (por ejemplo, UnrealSpeech)
    const apiKey = process.env.TTS_API_KEY;
    if(!apiKey) return res.status(500).json({ error: "API Key no configurada" });

    const ttsResp = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, voiceId: "Amy" })
    });

    if (!ttsResp.ok) return res.status(500).json({ error: "Error en TTS" });

    const buffer = await ttsResp.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error generando audio" });
  }
}
