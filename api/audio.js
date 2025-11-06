// /api/audio.js — versión final para tu proyecto del VISOR

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    // 🔑 Tu clave API de UnrealSpeech (asegúrate de tenerla como variable en Vercel)
    const apiKey = process.env.UNREAL_API_KEY;

    // 📡 Llamamos directamente a UnrealSpeech desde tu backend
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Scarlett",
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1",
        Codec: "mp3",
        Emotion: "default"
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("❌ Error UnrealSpeech:", err);
      return res.status(500).json({ error: "Error al conectar con UnrealSpeech" });
    }

    // 🕗 Guardamos el audio temporalmente en un buffer
    const audioBuffer = await response.arrayBuffer();

    // 🔄 Convertimos el buffer en Base64 para crear una URL temporal reproducible
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    // 📤 Enviamos la URL base64 al cliente
    res.status(200).json({ url: audioUrl });

  } catch (error) {
    console.error("Error en proxy UnrealSpeech:", error);
    res.status(500).json({ error: "Error al generar el audio" });
  }
}
