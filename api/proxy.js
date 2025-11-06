// api/proxy.js
export default async function handler(req, res) {
  try {
    // Detectamos qué tipo de solicitud se está haciendo
    const { text, pokemon } = req.body || {};

    // Si viene texto, se trata del audio
    if (text) {
      const unrealKey = process.env.UNREAL_API_KEY;
      if (!unrealKey) {
        return res.status(500).json({ error: "Falta la clave UnrealSpeech" });
      }

      try {
        const audioResp = await fetch("https://api.v7.unrealspeech.com/stream", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${unrealKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Text: text,
            VoiceId: "Amy", // puedes usar Liv, Scarlett, Dan, Will, Amy
            Bitrate: "192k",
            Speed: "1.0",
            Pitch: "1.0",
            Codec: "libmp3lame",
            OutputFormat: "mp3",
          }),
        });

        if (!audioResp.ok) {
          const errorText = await audioResp.text();
          console.error("Error UnrealSpeech:", errorText);
          return res.status(500).json({ error: "Error al generar audio UnrealSpeech" });
        }

        // Convertimos a buffer de audio
        const buffer = Buffer.from(await audioResp.arrayBuffer());

        // Creamos un Blob URL temporal accesible (AppCreator lo puede reproducir)
        const base64 = buffer.toString("base64");
        const dataUrl = `data:audio/mp3;base64,${base64}`;

        return res.status(200).json({ url: dataUrl });
      } catch (err) {
        console.error("Error en generación de audio:", err);
        return res.status(500).json({ error: "Error interno al generar el audio" });
      }
    }

    // Si viene el nombre del Pokémon, entonces es la búsqueda normal
    if (pokemon) {
      const targetBase = "https://pokeasistente-ia-generative.vercel.app"; // tu dominio principal
      const url = `${targetBase}/api/pokemon`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokemon }),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // Si no se especifica ni texto ni pokemon
    res.status(400).json({ error: "Solicitud no válida. Falta 'text' o 'pokemon'." });

  } catch (error) {
    console.error("Error en proxy principal:", error);
    res.status(500).json({ error: "Error al conectar con el servidor proxy" });
  }
}
