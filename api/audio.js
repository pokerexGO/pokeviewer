import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    console.log("📥 Texto recibido para TTS:", text);

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    console.log("🔊 Solicitando audio a UnrealSpeech...");

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
      console.error("❌ Error en respuesta de UnrealSpeech:", errorText);
      throw new Error(`Error en UnrealSpeech: ${errorText}`);
    }

    console.log("✅ Audio recibido desde UnrealSpeech, convirtiendo...");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    console.log("🎧 Audio convertido a Base64, enviando al cliente...");

    res.status(200).json({
      success: true,
      audioUrl: `data:audio/mp3;base64,${base64Audio}`,
    });
  } catch (error) {
    console.error("💥 Error general en proxy UnrealSpeech:", error);
    res.status(500).json({
      error: "Error al generar el audio.",
      details: error.message,
    });
  }
}
