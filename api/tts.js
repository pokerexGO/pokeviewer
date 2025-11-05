// api/tts.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    // Llamada a UnrealSpeech API
    const ttsResp = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.UNREAL_API_KEY}`
      },
      body: JSON.stringify({
        voice: "Amy",   // Cambia a Liv, Scarlett, Will, Dan, Amy
        text
      })
    });

    if (!ttsResp.ok) {
      const errorText = await ttsResp.text();
      console.error("UnrealSpeech error:", errorText);
      return res.status(500).json({ error: "TTS API error" });
    }

    const arrayBuffer = await ttsResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Enviar audio directamente
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length
    });
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating TTS" });
  }
});

export default router;
