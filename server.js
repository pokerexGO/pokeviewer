// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ==============================
// TTS - Unreal Speech
// ==============================
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Texto vacío" });
    }

    // 🔑 Verificamos que la clave exista
    if (!process.env.UNREAL_SPEECH_API_KEY) {
      console.error("⚠️ Falta la variable UNREAL_SPEECH_API_KEY en Vercel");
      return res.status(500).json({ error: "API Key no configurada" });
    }

    // 🎧 Petición a UnrealSpeech
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_SPEECH_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Liv", // puedes cambiar a "Will", "Domi", "Chris"
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1.0",
        Codec: "mp3"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Error UnrealSpeech:", errText);
      return res.status(500).json({ error: "Error generando el audio" });
    }

    // 🔊 Convertimos la respuesta a audio
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);

  } catch (error) {
    console.error("🔥 Error en /api/tts:", error);
    res.status(500).json({ error: "Error interno en /api/tts" });
  }
});

// ==============================
// PROXY (API intermedia hacia tu servidor principal de Pokémon)
// ==============================
app.post("/api/proxy", async (req, res) => {
  try {
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
});

// ==============================
// PUERTO LOCAL (si pruebas fuera de Vercel)
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
