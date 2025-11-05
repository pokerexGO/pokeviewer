// api/proxy.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });
  const { pokemon } = req.body;
  if (!pokemon) return res.status(400).json({ error: "Se requiere el nombre del Pokémon" });

  try {
    // Obtener datos desde PokeAPI
    const pokeResp = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.toLowerCase()}`);
    if (!pokeResp.ok) return res.status(404).json({ error: "Pokémon no encontrado" });
    const pokeData = await pokeResp.json();

    // Datos básicos: sprite + ataques
    const sprite = pokeData.sprites?.front_default || "";
    const moves = pokeData.moves.map(m => m.move.name).slice(0,5).join(", ");
    const tipos = pokeData.types.map(t => t.type.name).join(", ");
    const respuesta = `Tipo: ${tipos}\nAtaques recomendados: ${moves}`;

    res.status(200).json({ sprite, respuesta });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener datos del Pokémon" });
  }
}
