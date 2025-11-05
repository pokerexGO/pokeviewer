// server.js
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// --- API Proxy para Pokémon ---
app.post("/api/proxy", async (req, res) => {
  try {
    const { pokemon } = req.body;
    if (!pokemon) return res.status(400).json({ error: "No se recibió nombre de Pokémon" });

    const targetUrl = "https://pokeasistente-ia-generative.vercel.app/api/pokemon";
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pokemon })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Error proxy Pokémon:", err);
    res.status(500).json({ error: "Error conectando con la API principal" });
  }
});

// --- API TTS usando OpenAI ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") return res.status(400).json({ error: "Texto vacío" });

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = `data:audio/mpeg;base64,${buffer.toString("base64")}`;

    res.json({ audioBase64: base64Audio });
  } catch (err) {
    console.error("Error TTS:", err);
    res.status(500).json({ error: "Error generando audio" });
  }
});

// --- Iniciar servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;

