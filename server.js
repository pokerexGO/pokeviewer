import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/proxy", async (req, res) => {
  try {
    const { pokemon } = req.body;
    if (!pokemon) return res.status(400).json({ error: "Falta el nombre del Pokémon" });

    // Ejemplo de respuesta simulada (puedes adaptar con tu API real de Gemini)
    const respuesta = `Nombre: ${pokemon}. Tipo: Eléctrico. Descripción: Un Pokémon muy amigable y poderoso.`;
    const sprite = `https://img.pokemondb.net/artwork/${pokemon}.jpg`;

    res.json({ respuesta, sprite });
  } catch (err) {
    console.error("Error en proxy:", err);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// 🔊 Nueva ruta para Unreal Speech
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texto vacío" });

    const unrealKey = process.env.UNREAL_KEY;
    if (!unrealKey) return res.status(500).json({ error: "Falta la API Key de Unreal Speech" });

    const resp = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${unrealKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Daniel",
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1",
        Codec: "mp3"
      })
    });

    if (!resp.ok) {
      const msg = await resp.text();
      return res.status(500).json({ error: "Error Unreal Speech: " + msg });
    }

    const arrayBuffer = await resp.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Error TTS Unreal:", err);
    res.status(500).json({ error: "Fallo al generar audio" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
