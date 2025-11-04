// Este archivo recibe { text: "..." } y devuelve un audio mp3
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const { text } = req.body;
    if (!text || text.trim() === "") return res.status(400).json({ error: "Texto vacío" });

    // Usamos la API de OpenAI TTS o cualquier servicio TTS que tengas
    // Aquí un ejemplo con OpenAI
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
      console.error("Error TTS:", errText);
      return res.status(500).json({ error: "Error generando audio TTS" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);

  } catch (error) {
    console.error("Error en /api/tts:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
