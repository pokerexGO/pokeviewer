// API para generar audio TTS y devolver Base64
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Texto vacío" });
    }

    // Llamada a la API TTS (ejemplo con OpenAI)
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error generando audio TTS:", errText);
      return res.status(500).json({ error: "Error generando audio TTS" });
    }

    // Convertimos el audio a Base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");

    // Retornamos como JSON
    res.status(200).json({ audioBase64: `data:audio/mpeg;base64,${audioBase64}` });

  } catch (error) {
    console.error("Error en /api/tts:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
