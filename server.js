// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Configurar rutas estáticas (sirve para mostrar el index.html si es necesario)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ======================================================
// RUTA PRINCIPAL DE LA API: /api/pokemon  (tu función original)
// ======================================================
app.post("/api/pokemon", async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta || pregunta.trim() === "") {
      return res.status(400).json({ error: "La pregunta no puede estar vacía." });
    }

    // Aquí se llama a tu API de Gemini (como hacías en el proyecto principal)
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + process.env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: pregunta }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error en API Gemini:", data);
      return res.status(500).json({ error: "Error en API Gemini" });
    }

    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se obtuvo respuesta.";
    res.json({ texto });

  } catch (error) {
    console.error("Error en /api/pokemon:", error);
    res.status(500).json({ error: "Error interno en /api/pokemon" });
  }
});

// ======================================================
// RUTA PARA CONVERTIR TEXTO A AUDIO (UNREAL SPEECH)
// ======================================================
app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Texto vacío." });
    }

    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_SPEECH_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Will",   // Puedes cambiar la voz (ej: "Domi", "Liv", "Chris")
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1.0",
        Codec: "mp3"
      })
    });

    if (!unrealResponse.ok) {
      const errText = await unrealResponse.text();
      console.error("Error en Unreal Speech:", errText);
      return res.status(500).json({ error: "Error generando el audio" });
    }

    const arrayBuffer = await unrealResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);

  } catch (error) {
    console.error("Error en /api/tts:", error);
    res.status(500).json({ error: "Error interno en /api/tts" });
  }
});

// ======================================================
// PUERTO Y EJECUCIÓN DEL SERVIDOR
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
