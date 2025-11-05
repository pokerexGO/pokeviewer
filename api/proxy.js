export default async function handler(req, res) {
  try {
    const { pokemon } = req.body;
    if (!pokemon) return res.status(400).json({ error: "Falta el nombre del Pokémon" });

    const respuesta = `Nombre: ${pokemon}. Tipo: Agua. Descripción: Un Pokémon con una gran afinidad por el océano.`;
    const sprite = `https://img.pokemondb.net/artwork/${pokemon}.jpg`;

    res.json({ respuesta, sprite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el proxy" });
  }
}
