export default async function handler(req, res) {
  try {
    const { text } = req.body;

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
        Codec: "libmp3lame",   // 👈 CORRECTO según UnrealSpeech (ya no se usa "mp3")
        OutputFormat: "mp3"    // 👈 RECOMENDADO: formato final del archivo
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en UnrealSpeech: ${errorText}`);
    }

    // Convertir el audio a Base64 (crea una URL temporal reproducible)
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    // Devolver la URL lista para el navegador o AppCreator24
    res.status(200).json({ url: audioUrl });
  } catch (error) {
    console.error("Error en proxy UnrealSpeech:", error);
    res.status(500).json({ error: "Error al conectar con UnrealSpeech" });
  }
}
