import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";

dotenv.config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;
    if (!texto || texto.trim() === "") {
      return res.status(400).json({ success: false, error: "Texto vacío" });
    }

    console.log("🎤 Texto recibido para TTS:", texto);

    // === 1️⃣ GENERAR AUDIO CON UNREALSPEECH ===
    const unrealResponse = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: texto,
        VoiceId: "Scarlett",
        Format: "mp3",
        Bitrate: "192k",
        Speed: 1.0,
        Pitch: 1.0,
      }),
    });

    if (!unrealResponse.ok) {
      const errText = await unrealResponse.text();
      console.error("❌ Error UnrealSpeech:", errText);
      return res.status(500).json({ success: false, error: "Error en UnrealSpeech", details: errText });
    }

    // Obtener el audio como buffer
    const audioBuffer = Buffer.from(await unrealResponse.arrayBuffer());
    console.log("🎧 Audio recibido de UnrealSpeech. Tamaño:", audioBuffer.length, "bytes");

    // === 2️⃣ SUBIR AUDIO A CLOUDINARY ===
    const formData = new FormData();
    formData.append("file", audioBuffer, { filename: "voz.mp3", contentType: "audio/mpeg" });
    formData.append("upload_preset", "pokeviewer_unsigned"); // tu preset unsigned
    formData.append("folder", "temp-audios");

    const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await cloudinaryResponse.json();
    console.log("☁️ Respuesta Cloudinary:", uploadData);

    if (!uploadData.secure_url) {
      return res.status(500).json({ success: false, error: "Error al subir a Cloudinary", details: uploadData });
    }

    // === 3️⃣ RESPUESTA FINAL ===
    return res.status(200).json({
      success: true,
      url: uploadData.secure_url,
    });

  } catch (err) {
    console.error("💥 Error general:", err);
    return res.status(500).json({
      success: false,
      error: "Error general en el servidor",
      details: err.message,
    });
  }
}
