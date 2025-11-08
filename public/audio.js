console.log("✅ Script cargado correctamente");

// Detectar entorno
const isAppCreator = typeof window.AppInventor !== "undefined";
console.log("🌐 Detección de entorno:", isAppCreator ? "AppCreator24" : "Navegador normal");

// --- BOTONES ---
const btnLeer = document.getElementById("leerBtn");
const btnProbar = document.getElementById("probarBtn"); // coincidiendo con el index
const depuracion = document.getElementById("debug"); // coincidiendo con index.html

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

  const payload = { texto }; // 🔹 coincide con el backend funcional

  try {
    logDepuracion("☁️ Usando backend /api/audio (Cloudinary + UnrealSpeech)");

    const respuesta = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await respuesta.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      logDepuracion("💥 Error: respuesta no es JSON válida del backend:");
      logDepuracion(rawText);
      return;
    }

    logDepuracion("📦 Respuesta del backend:\n" + JSON.stringify(data, null, 2));

    if (!data.success || !data.url) {
      logDepuracion("❌ Error en el backend: " + (data.error || "Sin URL válida"));
      if (data.bytes) logDepuracion(`📏 Tamaño del audio recibido: ${data.bytes} bytes`);
      return;
    }

    logDepuracion(`📏 Tamaño del audio generado: ${data.bytes} bytes`);
    logDepuracion("✅ URL Cloudinary recibida: " + data.url);

    reproducirAudio(data.url);

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

  audio.src = url;
  audio.oncanplaythrough = () => logDepuracion("🎶 Audio listo para reproducirse desde Cloudinary");
  audio.onerror = (e) => logDepuracion("❌ Error al cargar el audio: " + e.message);
  audio.play().catch((err) => logDepuracion("⚠️ No se pudo reproducir el audio: " + err.message));
}

// --- BOTÓN LEER ---
btnLeer?.addEventListener("click", async () => {
  const texto = "Este es un Pokémon de tipo eléctrico conocido por sus mejillas que almacenan electricidad.";
  await generarAudio(texto);
});

// --- BOTÓN PROBAR TTS DIRECTO ---
btnProbar?.addEventListener("click", async () => {
  logDepuracion("🧪 Botón 'Probar TTS directo' presionado.");
  const texto = "Hola, este es un test directo del generador de voz UnrealSpeech usando Cloudinary.";
  await generarAudio(texto);
});
