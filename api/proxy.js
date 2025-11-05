// api/proxy.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { pokemon } = req.body;
    if (!pokemon) return res.status(400).json({ error: "Nombre no proporcionado" });

    const apiUrl = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemon.toLowerCase())}`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("Pokémon no encontrado");

    const data = await response.json();
    const respuesta = `Nombre: ${data.name}. Altura: ${data.height}. Peso: ${data.weight}. Tipo: ${data.types.map(t=>t.type.name).join(", ")}.`;

    res.status(200).json({ respuesta });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
}
