import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    // 🔹 Llamada a UnrealSpeech API
    const response = await fetch("https://api.v7.unrealspeech.com/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.UNREAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Text: text,
        VoiceId: "Will",
        Bitrate: "192k",
        Speed: "1.0",
        Codec: "libmp3lame",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en UnrealSpeech: ${errorText}`);
    }

    // 🔹 Convertir a buffer binario
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🔹 Crear carpeta temporal dentro de /public/temp
    const tempDir = path.join(process.cwd(), "public", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 🔹 Guardar el archivo MP3
    const filename = `voz-${Date.now()}.mp3`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, buffer);

    // 🔹 Generar URL pública (desde el dominio del proyecto)
    const publicUrl = `https://${req.headers.host}/temp/${filename}`;

    console.log("✅ Audio generado correctamente:", publicUrl);

    // 🔹 Devolver respuesta clara
    res.status(200).json({
      success: true,
      audioUrl: publicUrl,
    });

  } catch (error) {
    console.error("💥 Error en proxy UnrealSpeech:", error);
    res.status(500).json({
      success: false,
      error: "Error al generar el audio.",
      details: error.message,
    });
  }
}
