console.log("✅ Script cargado correctamente");

// Detectar entorno
const isAppCreator = typeof window.AppInventor !== "undefined";
console.log("🌐 Detección de entorno:", isAppCreator ? "AppCreator24" : "Navegador");

// --- BOTONES ---
const btnLeer = document.getElementById("leerBtn");
const btnProbar = document.getElementById("probarBtn");
const depuracion = document.getElementById("debug");

// Función para mostrar logs en la zona de depuración
function logDepuracion(mensaje) {
  console.log(mensaje);
  if (depuracion) {
    const linea = document.createElement("div");
    linea.textContent = mensaje;
    depuracion.appendChild(linea);
    depuracion.scrollTop = depuracion.scrollHeight;
  }
}

// --- FUNCIONES ---
async function generarAudio(texto) {
  logDepuracion("🎯 Botón Leer presionado. Texto: " + texto);

  if (!texto.trim()) {
    logDepuracion("⚠️ Texto vacío, no se genera audio");
    return;
  }

  try {
    logDepuracion("☁️ Usando backend /api/audio (Cloudinary + UnrealSpeech)");

    const respuesta = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // ✅ el backend espera "text", no "texto"
      body: JSON.stringify({ text: texto }),
    });

    const rawText = await respuesta.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      logDepuracion("💥 Respuesta no es JSON válida del backend:");
      logDepuracion(rawText);
      return;
    }

    logDepuracion("📦 Respuesta del backend:\n" + JSON.stringify(data, null, 2));

    // ✅ usa "audioUrl" (no "url")
    if (!data.success || !data.audioUrl) {
      logDepuracion("❌ Error en el backend: " + (data.error || "Sin audioUrl válida"));
      if (data.bytes) logDepuracion(`📏 Tamaño del audio recibido: ${data.bytes} bytes`);
      return;
    }

    logDepuracion(`📏 Tamaño del audio generado: ${data.bytes} bytes`);
    logDepuracion("✅ URL Cloudinary recibida: " + data.audioUrl);

    reproducirAudio(data.audioUrl);

  } catch (err) {
    logDepuracion("💥 Error al generar audio: " + err.message);
  }
}

function reproducirAudio(url) {
  logDepuracion("▶️ Reproducción iniciada desde: " + url);

  // Crear o usar el <audio> existente
  let audio = document.getElementById("audioPlayer");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "audioPlayer";
    audio.controls = true;
    document.body.appendChild(audio);
  }

  audio.pause();
  audio.src = "";
  audio.src = url;
  audio.type = "audio/mpeg"; // fuerza compatibilidad MP3
  audio.load();

  // Forzar reproducción incluso si el audio es muy corto
  audio.oncanplaythrough = () => {
    logDepuracion("🎶 Audio listo para reproducirse desde Cloudinary");
    audio.play().catch(err => logDepuracion("⚠️ Error al reproducir: " + err.message));
  };

  audio.onerror = (e) => {
    logDepuracion("❌ Error al cargar el audio: " + e.message);
  };
}

// --- BOTÓN LEER ---
btnLeer?.addEventListener("click", async () => {
  const texto = document.getElementById("texto").value.trim();
  await generarAudio(texto);
});

// --- BOTÓN PROBAR TTS DIRECTO ---
btnProbar?.addEventListener("click", async () => {
  const testText = "Hola, este es un test directo del generador de voz UnrealSpeech usando Cloudinary.";
  document.getElementById("texto").value = testText;
  logDepuracion("🧪 Botón 'Probar TTS directo' presionado.");
  await generarAudio(testText);
});
