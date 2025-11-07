export default async function handler(req, res) {
  console.log("🎧 [API] /api/audio.js ejecutado (modo base64)");

  try {
    const { text } = req.body;
    console.log("📝 Texto recibido:", text?.slice(0, 80) || "(vacío)");

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    const apiKey = process.env.UNREAL_API_KEY;
    if (!apiKey) {
      console.error("🚫 Falta UNREAL_API_KEY en Vercel.");
      return res.status(500).json({ error: "Falta la variable UNREAL_API_KEY en Vercel." });
    }

    console.log("🌐 Solicitando audio a UnrealSpeech...");
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
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

    console.log("📡 Estado UnrealSpeech:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("💥 Error UnrealSpeech:", errorText);
      throw new Error(errorText);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:audio/mp3;base64,${base64Audio}`;

    console.log("✅ Audio generado correctamente (base64)");
    res.status(200).json({ url: dataUrl });
  } catch (error) {
    console.error("💥 Error general en audio.js:", error);
    res.status(500).json({
      error: "Error al generar el audio.",
      details: error.message || "Sin detalles disponibles",
    });
  }
}
