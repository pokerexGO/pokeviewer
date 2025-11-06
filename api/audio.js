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

    console.log("🟢 Enviando texto a UnrealSpeech:", text);

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
        Codec: "libmp3lame", // ✅ CORREGIDO
        Emotion: "default"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Error UnrealSpeech (detalle):", errText);
      return res.status(500).json({
        error: "Error al conectar con UnrealSpeech",
        detalle: errText
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    console.log("✅ Audio generado correctamente");
    res.status(200).json({ url: audioUrl });

  } catch (error) {
    console.error("❌ Error completo en handler:", error);
    res.status(500).json({
      error: "Error interno al conectar con la API UnrealSpeech",
      detalle: error.message
    });
  }
}
