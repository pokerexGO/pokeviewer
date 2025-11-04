// tts.js
import express from "express";
import bodyParser from "body-parser";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // tu clave de OpenAI
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post("/api/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No se recibió texto" });

    // Generar TTS usando OpenAI
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",      // puedes cambiar la voz si quieres
      input: text
    });

    // response contiene un ArrayBuffer, lo convertimos a base64
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = `data:audio/mpeg;base64,${buffer.toString("base64")}`;

    res.json({ audioBase64: base64Audio });
  } catch (err) {
    console.error("Error TTS:", err);
    res.status(500).json({ error: "Error generando audio" });
  }
});

export default app;
