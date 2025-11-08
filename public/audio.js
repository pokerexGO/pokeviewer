console.log("✅ Script cargado correctamente");

// Detectar entorno
const isAppCreator = typeof window.AppInventor !== "undefined";
console.log("🌐 Detección de entorno:", isAppCreator ? "AppCreator24" : "Navegador normal");

// --- BOTONES ---
const btnLeer = document.getElementById("leerBtn");
const btnProbar = document.getElementById("probarTTSBtn");

// --- FUNCIONES ---
async function generarAudio(texto) {
  console.log("🎯 Botón Leer presionado. Texto:", texto);

  const payload = {
    texto: texto,
  };

  console.log("☁️ Usando backend /api/audio (Cloudinary + UnrealSpeech)");

  try {
    const respuesta = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await respuesta.json();
    console.log("📦 Respuesta del backend:\n", data);

    if (data.success && data.url) {
      console.log("✅ URL Cloudinary recibida:", data.url);
      reproducirAudio(data.url);
    } else {
      console.error("❌ Error en la respuesta del backend:", data.error || "Sin URL válida");
    }
  } catch (err) {
    console.error("💥 Error al contactar el backend:", err);
  }
}

function reproducirAudio(url) {
  console.log("▶️ Reproducción iniciada desde:", url);
  const audio = new Audio(url);

  audio.oncanplaythrough = () => console.log("🎶 Audio listo para reproducirse desde Cloudinary");
  audio.onerror = (e) => console.error("❌ Error al cargar el audio:", e);

  audio.play().catch((err) => console.error("⚠️ No se pudo reproducir el audio:", err));
}

// --- BOTÓN LEER ---
btnLeer?.addEventListener("click", async () => {
  const texto = "Este es un Pokémon de tipo eléctrico conocido por sus mejillas que almacenan electricidad.";
  await generarAudio(texto);
});

// --- BOTÓN PROBAR TTS DIRECTO ---
btnProbar?.addEventListener("click", async () => {
  console.log("🧪 Botón 'Probar TTS directo' presionado.");
  const texto = "Hola, este es un test directo del generador de voz UnrealSpeech usando Cloudinary.";

  try {
    const respuesta = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });

    const data = await respuesta.json();
    console.log("📦 Respuesta del backend (TTS directo):\n", data);

    if (data.success && data.url) {
      console.log("✅ URL Cloudinary recibida:", data.url);
      reproducirAudio(data.url);
    } else {
      console.error("❌ Error: el backend no devolvió una URL válida.", data.error || data.details);
    }
  } catch (error) {
    console.error("💥 Error al ejecutar el test TTS directo:", error);
  }
});
