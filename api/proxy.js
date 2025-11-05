// api/proxy.js
export default async function handler(req, res) {
  try {
    // Aseguramos que sea una petición POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    const { pokemon } = req.body;

    if (!pokemon) {
      return res.status(400).json({ error: "Falta el nombre del Pokémon" });
    }

    // 🔹 Aquí podrías conectar con una API real (por ejemplo, la de Gemini o PokéAPI)
    // Pero para mantener compatibilidad con AppCreator24, devolvemos texto simulado:
    const respuesta = `
      Nombre: ${pokemon}.
      Tipo: Agua.
      Descripción: ${pokemon} es un Pokémon con una gran afinidad por el océano.
      Ataques recomendados: Surf, Hidrobomba, Cascada.
    `;

    // Imagen representativa del Pokémon
    const sprite = `https://img.pokemondb.net/artwork/${pokemon}.jpg`;

    // 🔹 Enviamos la información como respuesta JSON
    res.status(200).json({
      respuesta,
      sprite,
    });

  } catch (err) {
    console.error("Error en el proxy:", err);
    res.status(500).json({ error: "Error en el proxy del servidor" });
  }
}
