export default async function handler(req, res) {
  try {
    // Dominio del backend principal donde está tu API de Pokémon
    const targetBase = "https://pokeasistente-ia-generative.vercel.app"; // 👈 cambia si usas otro dominio
    const url = `${targetBase}/api/pokemon`;

    // Reenviamos la petición al servidor principal
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    // Intentamos convertir la respuesta a JSON
    const data = await response.json();

    // Si la respuesta fue exitosa, la reenviamos al cliente
    res.status(response.status).json(data);

  } catch (error) {
    console.error("❌ Error en proxy:", error);
    res.status(500).json({ error: "Error al conectar con la API principal" });
  }
}
