// api/tts.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texto vacío" });

    const unrealKey = process.env.UNREAL_API_KEY;
    if (!unrealKey) return res.status(500).json({ error: "Falta la clave UnrealSpeech" });

    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${unrealKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Scarlett" // Puedes cambiar por Liv, Amy, Dan o Will
      }),
    });

    if (!response.ok) throw new Error("Error al generar audio UnrealSpeech");

    const audioBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
