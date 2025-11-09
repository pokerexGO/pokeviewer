console.log("✅ Script cargado correctamente");

// Detectar entorno
const isAppCreator = typeof window.AppInventor !== "undefined";
console.log("🌐 Detección de entorno:", isAppCreator ? "AppCreator24" : "Navegador");

// --- BOTONES ---
const btnLeer = document.getElementById("leerBtn");
const btnProbar = document.getElementById("probarBtn"); // coincide con index
const depuracion = document.getElementById("debug"); // coincide con index.html

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
  if (!texto || texto.trim().length === 0) {
    logDepuracion("⚠️ No se ingresó texto para generar audio.");
    return;
  }

  logDepuracion("🎯 Botón Leer presionado. Texto: " + texto);

  const payload = { texto }; // coincide con backend

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

    // Reproducir audio aunque sea muy corto
    reproducirAudio(data.url);

  } catch (err) {
    logDepuracion("💥 Error al generar audio: " + err.message);
  }
}

function reproducirAudio(url) {
  logDepuracion("▶️ Reproducción iniciada desde: " + url);

  let audio = document.getElementById("audioPlayer");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "audioPlayer";
    audio.controls = true;
    document.body.appendChild(audio);
  }

  // Crear un blob para forzar compatibilidad si el archivo es muy pequeño
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;
      audio.load();
      return audio.play();
    })
    .then(() => logDepuracion("🎶 Audio reproducido correctamente"))
    .catch(err => logDepuracion("⚠️ No se pudo reproducir el audio: " + err.message));
}

// --- BOTONES ---
btnLeer?.addEventListener("click", async () => {
  const texto = document.getElementById("texto").value.trim();
  await generarAudio(texto);
});

btnProbar?.addEventListener("click", async () => {
  const texto = "Hola, este es un test directo del generador de voz UnrealSpeech usando Cloudinary.";
  document.getElementById("texto").value = texto;
  logDepuracion("🧪 Botón 'Probar TTS directo' presionado.");
  await generarAudio(texto);
});
