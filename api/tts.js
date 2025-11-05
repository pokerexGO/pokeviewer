// API para generar audio TTS con Unreal Speech
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Texto vacío" });
    }

    const apiKey = process.env.UNREAL_API_KEY;
    if (!apiKey) {
      console.error("⚠️ No se encontró UNREAL_API_KEY en las variables de entorno");
      return res.status(500).json({ error: "Falta la clave de API del servidor" });
    }

    // Llamada a la API de Unreal Speech
    const response = await fetch("https://api.v6.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Scarlett",  // Puedes probar: "Will", "Scarlett", "Dan", etc.
        Bitrate: "192k",
        Speed: "1.0",
        Pitch: "1.0",
        Codec: "mp3"
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error en Unreal Speech:", errText);
      return res.status(500).json({ error: "Error generando el audio" });
    }

    // Convertimos el audio en base64 para enviarlo al navegador
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const audioBase64 = `data:audio/mpeg;base64,${base64Audio}`;

    res.status(200).json({ audioBase64 });
  } catch (error) {
    console.error("Error en /api/tts:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
