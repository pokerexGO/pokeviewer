import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se proporcionó texto para el TTS." });
    }

    console.log("🎯 Texto recibido:", text);

    // Llamada a UnrealSpeech
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
        Codec: "libmp3lame", // MP3 correcto
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error en UnrealSpeech:", errorText);
      throw new Error(`Error en UnrealSpeech: ${errorText}`);
    }

    // Convertir la respuesta en buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Crear carpeta /public/temp si no existe
    const tempDir = path.join(process.cwd(), "public", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Guardar el archivo temporal
    const filename = `voz-${Date.now()}.mp3`;
    const filepath = path.join(tempDir, filename);
    fs.writeFileSync(filepath, buffer);

    console.log("✅ Archivo guardado:", filepath);

    // Generar URL pública para AppCreator24
    const publicUrl = `https://${req.headers.host}/api/temp-audio?file=${filename}`;

    console.log("🌐 URL pública generada:", publicUrl);

    // Enviar URL pública al cliente
    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error("💥 Error general en /api/audio:", error);
    res.status(500).json({ error: "Error al generar el audio." });
  }
}
