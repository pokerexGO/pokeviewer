const btnLeer = document.getElementById("leerBtn");
const btnProbar = document.getElementById("probarBtn");
const textoInput = document.getElementById("texto");
const depuracion = document.getElementById("debug");
const audioPlayer = document.getElementById("audioPlayer");

function log(msg) {
  console.log(msg);
  if (depuracion) {
    const linea = document.createElement("div");
    linea.textContent = msg;
    depuracion.appendChild(linea);
    depuracion.scrollTop = depuracion.scrollHeight;
  }
}

async function generarAudio(texto) {
  log("🎯 Generando audio: " + texto);

  try {
    const respuesta = await fetch("/api/audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });

    const data = await respuesta.json();

    if (!data.success || !data.url) {
      log("❌ Error backend: " + (data.error || "Sin URL válida"));
      return;
    }

    log(`📏 Tamaño del audio: ${data.bytes} bytes`);
    log(`✅ URL Cloudinary: ${data.url}`);

    // 🔹 Crear Blob para reproducir
    const resAudio = await fetch(data.url);
    const arrayBuffer = await resAudio.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/mp3" });
    const blobUrl = URL.createObjectURL(blob);

    audioPlayer.src = blobUrl;
    audioPlayer.play().then(() => log("▶️ Reproducción iniciada")).catch(err => log("⚠️ Error reproducir: " + err.message));

  } catch (err) {
    log("💥 Error generar audio: " + err.message);
  }
}

btnLeer.addEventListener("click", async () => {
  const texto = textoInput.value.trim();
  if (!texto) { log("⚠️ No ingresó texto."); return; }
  await generarAudio(texto);
});

btnProbar.addEventListener("click", async () => {
  const testText = "Hola, este es un test directo de UnrealSpeech usando Cloudinary.";
  textoInput.value = testText;
  log("🧪 Botón 'Probar TTS directo'");
  await generarAudio(testText);
});
