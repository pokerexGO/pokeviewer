import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  console.log("🎧 [API] /api/audio.js llamado...");

  try {
    const { text } = req.body;
    console.log("📝 Texto recibido para TTS:", text?.slice(0, 100) || "(vacío)");

    if (!text || text.trim() === "") {
      console.error("❌ No se proporcionó texto para el TTS.");
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    // 🔐 Verificar que la clave API esté presente
    const apiKey = process.env.UNREAL_API_KEY;
    if (!apiKey) {
      console.error("🚫 Falta la variable UNREAL_API_KEY en Vercel.");
      return res.status(500).json({ error: "Falta la variable UNREAL_API_KEY en Vercel." });
    }

    console.log("🌐 Enviando solicitud a UnrealSpeech...");

    // 🔊 Solicitud a UnrealSpeech
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Will",
        Bitrate: "192k",
        Speed: "1.0",
        Codec: "libmp3lame", // MP3
      }),
    });

    console.log("📡 Estado de respuesta UnrealSpeech:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("💥 Error de UnrealSpeech:", errorText);
      throw new Error(`UnrealSpeech respondió con error: ${errorText}`);
    }

    // 📦 Convertir el flujo binario a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 📁 Crear carpeta public/temp si no existe
    const tempDir = path.join(process.cwd(), "public", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log("📂 Carpeta /public/temp creada.");
    }

    // 💾 Guardar el archivo MP3
    const filename = `voz-${Date.now()}.mp3`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log("✅ Audio guardado:", filepath);

    // 🔗 Generar URL pública (para AppCreator24)
    const publicUrl = `https://${req.headers.host}/temp/${filename}`;
    console.log("🔊 URL pública generada:", publicUrl);

    // 📤 Enviar al cliente
    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error("💥 Error general en /api/audio:", error);
    res.status(500).json({
      error: "Error al generar el audio.",
      details: error.message || "Sin detalles disponibles",
    });
  }
}
