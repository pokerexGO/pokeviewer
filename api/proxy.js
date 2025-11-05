// api/proxy.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  const { pokemon } = req.body;
  if (!pokemon) {
    res.status(400).json({ error: "Se requiere el nombre del Pokémon" });
    return;
  }

  try {
    // ⚡ Ejemplo usando la API pública de PokéAPI
    const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.toLowerCase()}`);
    if (!r.ok) throw new Error("Pokémon no encontrado");
    const data = await r.json();

    // Extraemos sprite
    const sprite = data.sprites.front_default || "";

    // Creamos info resumida para mostrar
    const infoLines = [
      `Nombre: ${data.name}`,
      `Altura: ${data.height}`,
      `Peso: ${data.weight}`,
      `Tipos: ${data.types.map(t => t.type.name).join(", ")}`,
      `Ataques recomendados: ${data.moves.slice(0,5).map(m => m.move.name).join(", ")}`
    ];
    const respuesta = infoLines.join("\n");

    res.status(200).json({ respuesta, sprite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener información del Pokémon" });
  }
}
