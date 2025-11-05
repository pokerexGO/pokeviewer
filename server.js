// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configurar rutas estáticas (sirve index.html, etc.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ---------- 🔊 Endpoint TTS con Unreal Speech ----------
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Texto vacío o inválido" });
    }

    // Petición a Unreal Speech API
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_API_KEY}`, // Tu key en Vercel
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Scarlett", // Puedes probar con "Will", "Liv", etc.
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1.0",
        Codec: "mp3",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Error en Unreal Speech:", err);
      return res.status(500).json({ error: "Error en Unreal Speech API" });
    }

    // Convertimos la respuesta binaria en base64 para retornarla fácilmente
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

    res.json({ audioUrl });
  } catch (error) {
    console.error("Error en /api/tts:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ---------- 🚀 Puerto ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
