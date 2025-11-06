export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Falta el texto" });
    }

    const apiKey = process.env.UNREAL_API_KEY;
    if (!apiKey) {
      console.error("❌ No se encontró UNREAL_API_KEY en variables de entorno");
      return res.status(500).json({ error: "Falta la clave API" });
    }

    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Scarlett",
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1",
        Codec: "mp3",
        Emotion: "default"
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Error UnrealSpeech:", err);
      return res.status(500).json({ error: "Error al conectar con UnrealSpeech" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    res.status(200).json({ url: audioUrl });

  } catch (error) {
    console.error("Error en proxy UnrealSpeech:", error);
    res.status(500).json({ error: "Error al conectar con la API UnrealSpeech" });
  }
}
