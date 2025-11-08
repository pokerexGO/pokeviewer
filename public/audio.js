console.log("✅ Script cargado correctamente");

// Detectar entorno
const isAppCreator = typeof window.AppInventor !== "undefined";
console.log("🌐 Detección de entorno:", isAppCreator ? "AppCreator24" : "Navegador normal");

// --- BOTONES ---
const btnLeer = document.getElementById("leerBtn");
const btnProbar = document.getElementById("probarTTSBtn");
const depuracion = document.getElementById("depuracion");

// Función para mostrar logs en la zona de depuración
function logDepuracion(mensaje) {
  console.log(mensaje);
  if (depuracion) {
    const linea = document.createElement("div");
    linea.textContent = mensaje;
    depuracion.appendChild(linea);
  }
}

// --- FUNCIONES ---
async function generarAudio(texto) {
  logDepuracion("🎯 Botón Leer presionado. Texto: " + texto);

  const payload = { text: texto, voice: "Liv" }; // 🔹 Cambiado a text para el backend

  try {
    logDepuracion("☁️ Usando backend /api/audio (Cloudinary + UnrealSpeech)");

    const respuesta = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 🔹 Comprobamos si la respuesta fue exitosa antes de parsear JSON
    if (!respuesta.ok) {
      const text = await respuesta.text();
      throw new Error(text || "Error desconocido en el backend");
    }

    const data = await respuesta.json();
    logDepuracion("📦 Respuesta del backend:\n" + JSON.stringify(data, null, 2));

    if (data.success && data.url) {
      logDepuracion("✅ URL Cloudinary recibida: " + data.url);
      reproducirAudio(data.url);
    } else {
      logDepuracion("❌ Error en el backend: " + (data.error || "Sin URL válida"));
    }
  } catch (err) {
    logDepuracion("💥 Error al generar audio: " + err.message);
  }
}

function reproducirAudio(url) {
  logDepuracion("▶️ Reproducción iniciada desde: " + url);

  // 🔹 Crear un elemento <audio> en el DOM (mejor compatibilidad AppCreator)
  let audio = document.getElementById("audioPlayer");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "audioPlayer";
    audio.controls = false;
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
