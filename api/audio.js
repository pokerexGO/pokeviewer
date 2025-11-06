export default async function handler(req, res) {
  try {
    const targetBase = "https://pokeasistente-ia-generative.vercel.app"; // 👈 tu dominio principal
    const url = `${targetBase}/api/unrealspeech`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (error) {
    console.error("Error en proxy UnrealSpeech:", error);
    res.status(500).json({ error: "Error al conectar con la API UnrealSpeech" });
  }
}
