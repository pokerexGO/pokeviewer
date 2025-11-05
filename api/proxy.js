import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { pokemon } = req.body;

  try {
    // ✅ Aquí conectas con tu API de texto (Gemini u otro backend)
    const respuestaIA = `Aquí iría la descripción del Pokémon ${pokemon}. Este texto es un ejemplo simulado.`; 
    const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${Math.floor(Math.random() * 150) + 1}.png`;

    res.status(200).json({ respuesta: respuestaIA, sprite });
  } catch (error) {
    console.error("Error en proxy:", error);
    res.status(500).json({ error: "Error interno en proxy" });
  }
}
