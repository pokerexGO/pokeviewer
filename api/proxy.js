// api/proxy.js

export default async function handler(req, res) {
  try {
    const { pokemon } = req.body;
    if (!pokemon) return res.status(400).json({ error: "Falta el nombre del Pokémon" });

    // Texto generado (como lo tenías)
    const respuesta = `Nombre: ${pokemon}. Tipo: Agua. Descripción: Un Pokémon con una gran afinidad por el océano.`;
    const sprite = `https://img.pokemondb.net/artwork/${pokemon}.jpg`;

    // Llamada al TTS (Unreal Speech) usando tu endpoint interno
    const ttsResponse = await fetch(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: respuesta }),
    });

    let audioUrl = null;

    if (ttsResponse.ok) {
      // Guardamos el audio como blob temporal en Base64
      const audioBuffer = await ttsResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString("base64");
      audioUrl = `data:audio/mp3;base64,${audioBase64}`;
    } else {
      console.error("No se pudo generar el audio desde TTS.");
    }

    // Enviamos toda la información al index.html
    res.json({
      respuesta,
      sprite,
      audio: audioUrl || null,
    });
  } catch (err) {
    console.error("Error en el proxy:", err);
    res.status(500).json({ error: "Error en el proxy" });
  }
}
