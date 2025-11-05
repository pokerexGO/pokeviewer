export default async function handler(req, res) {
  try {
    // Si la solicitud es para generar audio TTS
    if (req.url.includes("/tts")) {
      if (req.method !== "POST")
        return res.status(405).json({ error: "Método no permitido" });

      const { text } = req.body;
      if (!text || text.trim() === "")
        return res.status(400).json({ error: "Texto vacío" });

      // 🔹 Redirigimos la solicitud al endpoint /api/tts de tu mismo dominio
      const ttsResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        console.error("Error al obtener audio del TTS:", errText);
        return res.status(500).json({ error: "Error al generar el audio TTS" });
      }

      // Obtenemos los datos de audio y los enviamos como respuesta
      const buffer = await ttsResponse.arrayBuffer();
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(Buffer.from(buffer));
      return;
    }

    // 🔹 Si no es TTS, sigue siendo una búsqueda Pokémon
    const targetBase = "https://pokeasistente-ia-generative.vercel.app";
    const url = `${targetBase}/api/pokemon`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error("Error en proxy:", error);
    res.status(500).json({ error: "Error al conectar con la API principal" });
  }
}
