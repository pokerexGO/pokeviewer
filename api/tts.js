import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { text } = req.body;

  try {
    const unrealResp = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Scarlett",
        Bitrate: "192k",
        Speed: "0",
        Pitch: "1.0",
        Codec: "mp3",
      }),
    });

    if (!unrealResp.ok) {
      const errText = await unrealResp.text();
      return res.status(500).json({ error: "Error Unreal Speech: " + errText });
    }

    const audioBuffer = await unrealResp.arrayBuffer();

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.byteLength);
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("Error en TTS:", error);
    res.status(500).json({ error: "Error interno TTS" });
  }
}
