<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>PokeViewer</title>
  <style>
    :root{
      --bg: #0d1117;
      --card-red: #d62828;
      --screen: #222;
      --accent: #ffcc00;
      --muted: #9aa4b2;
      --text: #e6edf3;
      --glass: rgba(255,255,255,0.02);
      --border: #444;
    }

    html,body{height:100%;margin:0;padding:0;background:var(--bg);color:var(--text);font-family:Arial,Helvetica,sans-serif;overflow:hidden;}
    body{display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;}

    .wrapper{ width:100%; max-width:380px; }

    .title-row { display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:12px; }
    .bolt {
      width:32px;height:32px;background:linear-gradient(180deg,#fff8b0,#ffcc00);
      clip-path: polygon(35% 0%, 60% 0%, 40% 55%, 70% 55%, 30% 100%, 40% 60%, 10% 60%);
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      opacity:0.9;
    }
    .title {
      font-size:1.7rem; font-weight:800; color:var(--accent); text-shadow:0 0 10px #ffcc0088;
      letter-spacing:0.6px;
    }
    @keyframes boltPulse { 0%{opacity:.18; transform:scale(.92) translateY(0);} 50%{opacity:1; transform:scale(1.06) translateY(-2px);} 100%{opacity:.28; transform:scale(.95) translateY(0);} }
    .bolt.left{ animation:boltPulse 2.2s ease-in-out infinite; animation-delay:0s; }
    .bolt.right{ animation:boltPulse 2.2s ease-in-out infinite; animation-delay:0.6s; }

    .pokedex {
      background: var(--card-red);
      border-radius:18px;
      padding:18px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      border: 2px solid rgba(0,0,0,0.35);
      display:flex;
      flex-direction:column;
      align-items:center;
    }

    .screen-container {
      background: var(--screen);
      border-radius:10px;
      border:3px solid var(--border);
      padding:14px;
      min-height:280px;
      max-height:50vh;
      width:100%;
      overflow:auto;
      box-sizing:border-box;
      transition: width 0.3s, max-height 0.3s;
    }

    .pokemon-img { width:160px; height:160px; display:block; margin:10px auto; border-radius:8px; background:var(--screen); animation:float 2.2s ease-in-out infinite; }
    @keyframes float { 0%{transform:translateY(0);} 50%{transform:translateY(-8px);} 100%{transform:translateY(0);} }

    #resultado p { background: rgba(0,0,0,0.35); padding:10px; border-radius:8px; margin:8px 0; line-height:1.45; transition: background 0.1s; }
    .tag { background: var(--accent); padding:4px 10px; border-radius:6px; font-weight:700; color:#0d1117; margin-right:8px; display:inline-block; }
    .highlight { background: rgba(255,165,0,0.35) !important; border-radius:6px; }

    .controls { margin-top:10px; display:flex; gap:10px; align-items:center; justify-content:center; flex-wrap:wrap; }
    input[type="text"]{ padding:12px 14px; border-radius:10px; width:64%; border:none; text-align:center; outline:none; font-size:1.1rem; }
    .btnBuscar{ padding:12px 14px; border-radius:10px; background:var(--accent); color:#0d1117; border:none; font-weight:800; cursor:pointer; font-size:1.05rem; }
    .btnClear{ padding:12px 14px; border-radius:10px; background:transparent; color:var(--text); border:1px solid rgba(255,255,255,0.06); cursor:pointer; font-size:1.05rem; }

    #btnAudio {
      margin:6px 0; /* Más cerca de los botones */
      width:100%;
      padding:14px;
      border-radius:10px;
      background:#222;
      border:2px solid transparent;
      color:#fff;
      cursor:pointer;
      font-weight:700;
      font-size:1.05rem;
      display:none;
      transition: transform 0.2s, box-shadow 0.2s, border 0.2s;
    }
    #btnAudio.speaking {
      border:2px solid #00f0ff;
      animation: pulseBtn 1s infinite alternate;
    }
    @keyframes pulseBtn {
      0% { transform: scale(1); box-shadow: 0 0 10px #00f0ff; }
      100% { transform: scale(1.05); box-shadow: 0 0 20px #00f0ff; }
    }

    .rayo {
      position:fixed; top:-120px; width:2px; height:120px; background:linear-gradient(180deg,#0ff,transparent); opacity:.6;
      animation:caer 1.1s linear infinite;
    }
    .rayo.r1 { left:14%; animation-delay:0s; }
    .rayo.r2 { left:50%; animation-delay:0.35s; }
    .rayo.r3 { left:86%; animation-delay:0.65s; }
    @keyframes caer { 0%{ transform:translateY(-120px); opacity:0; } 50%{ opacity:1; } 100%{ transform:translateY(100vh); opacity:0; } }

    @media (max-width:420px) {
      .wrapper{ max-width:320px; }
      .pokemon-img{ width:140px; height:140px; }
      .screen-container { min-height:240px; max-height:55vh; width:100%; }
      input[type="text"], .btnBuscar, .btnClear, #btnAudio { font-size:1rem; padding:10px 12px; }
    }

    /* POPUP (inyectado igual que en original) */
    #popupPago {
      display: none;
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    #popupContent {
      background: #1a1a1a;
      padding: 25px;
      border-radius: 12px;
      width: 90%;
      max-width: 360px;
      text-align: center;
      border: 1px solid #444;
    }
    #cerrarPopup {
      margin-top: 10px;
      background: red;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="title-row">
      <div class="bolt left"></div>
      <div class="title">PokeViewer</div>
      <div class="bolt right"></div>
    </div>

    <div class="pokedex">
      <div class="screen-container" id="screenContainer">
        <div id="screen"><p>🔍 Escribe un nombre de Pokémon para comenzar.</p></div>
      </div>

      <button id="btnAudio">🔊 Leer</button>

      <div class="controls">
        <input id="pokemonInput" type="text" placeholder="Ej: Pikachu" />
        <button id="buscarBtn" class="btnBuscar">Buscar</button>
        <button id="clearBtn" class="btnClear">Limpiar</button>
      </div>
    </div>
  </div>

  <div class="rayo r1"></div>
  <div class="rayo r2"></div>
  <div class="rayo r3"></div>

  <!-- POPUP CON BOTÓN PAYPAL (igual que en original) -->
  <div id="popupPago">
    <div id="popupContent">
      <h2>🔥 Versión Premium de Voz</h2>
      <p>Suscríbete por solo <b>$3/mes</b> y usa la voz ilimitadamente.</p>

      <!-- Contenedor del botón PayPal -->
      <div id="paypal-button-container-P-08M86817PK1059649NEOAHEY"></div>

      <button id="cerrarPopup">Cerrar</button>
    </div>
  </div>

  <!-- PayPal SDK (igual que tu original) -->
  <script src="https://www.paypal.com/sdk/js?client-id=Ad_Nq8cC1wRiz9DlMOZs9AhIH1caG4HS3mRC9EcOqLuqYVByBtlD2KuZcmA7oHgFmo47q5NLZu4sbfoc&vault=true&intent=subscription"></script>

  <audio id="audioPlayer" controls style="display:none;"></audio>

  <script>
  (function(){
    /*******
     * Elementos y estado
     *******/
    const input = document.getElementById('pokemonInput');
    const buscarBtn = document.getElementById('buscarBtn');
    const clearBtn = document.getElementById('clearBtn');
    const screen = document.getElementById('screen');
    const screenContainer = document.getElementById('screenContainer');
    const btnAudioEl = document.getElementById('btnAudio');
    const popup = document.getElementById('popupPago');
    const cerrarPopup = document.getElementById('cerrarPopup');
    const audioPlayer = document.getElementById('audioPlayer');

    // estado de suscripción (temporal/local). Debes reemplazar por verificación server-side cuando lo tengas.
    let usuarioSuscrito = false;

    // para el resaltado sincronizado
    let paragraphs=[], paragraphElements=[], currentParagraphIndex=0;
    let highlightTimer = null;
    let syncTimer = null;

    // flags de reproducción
    let isPlayingViaAudioFile = false;
    let paused = false;

    /*******
     * Utilidades (igual que antes)
     *******/
    function esc(s){ return s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""; }
    function splitText(text){ return text ? text.replace(/[*\/#]/g,"").split(/\n+/).map(l=>l.trim()).filter(l=>l) : []; }

    function organize(text){
      const paras = splitText(text);
      const sections = {};
      paras.forEach(p=>{
        const m=p.match(/^([^:]{2,40}):\s*(.*)$/);
        if(m){
          let tag = m[1].trim();
          if(tag.toLowerCase().includes("ataques recomendados")) tag="Ataques";
          const content = m[2].trim();
          if(!sections[tag]) sections[tag]=[];
          sections[tag].push(content);
        } else {
          if(!sections["Información"]) sections["Información"]=[]; 
          sections["Información"].push(p);
        }
      });
      if(!sections["Información"] || sections["Información"].length===0) sections["Información"]=["Información no disponible"];
      Object.keys(sections).forEach(tag=>{
        sections[tag] = sections[tag].filter(line=>line.trim());
        if(sections[tag].length===0) sections[tag]=["Información no disponible"];
      });
      const out=[];
      Object.keys(sections).forEach(tag=>{ if(sections[tag].length) out.push({tag,text:sections[tag].join(" ")}); });
      const html = out.map(s=><p><span class="tag">${esc(s.tag)}</span> ${esc(s.text)}</p>).join("");
      const parasForTTS = out.map(s=>s.tag+": "+s.text);
      return {html, parasForTTS};
    }

    function showLoading(name){
      stopPlaybackAndClear();
      if(window.speechSynthesis) window.speechSynthesis.cancel();
      screen.innerHTML=<p>🔎 Buscando información sobre <strong>${esc(name)}</strong>...</p>;
      btnAudioEl.style.display="none";
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border="2px solid transparent";
      clearInterval(highlightTimer);
    }

    function showError(msg){
      stopPlaybackAndClear();
      screen.innerHTML=<p>❌ ${esc(msg)}</p>;
      btnAudioEl.style.display="none";
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border="2px solid transparent";
      clearInterval(highlightTimer);
    }

    async function buscarPokemon(nombre){
      if(!nombre) return;
      showLoading(nombre);
      try{
        const resp = await fetch("/api/proxy", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({pokemon:nombre})});
        if(!resp.ok){ showError("Error en el servidor: "+resp.status); return; }
        const data = await resp.json();
        if(data.error || !data.respuesta){ showError(data.error||"No se recibió respuesta."); return; }

        const sprite = data.sprite||"";
        const organized = organize(data.respuesta);

        screen.innerHTML = (sprite?<img src="${esc(sprite)}" alt="${esc(nombre)}" class="pokemon-img">:"")+
                            <h2 style="text-align:center; color:var(--accent)">${esc(nombre.toUpperCase())}</h2>+
                            <div id="resultado">${organized.html}</div>;

        paragraphs = organized.parasForTTS;
        paragraphElements = Array.from(document.querySelectorAll("#resultado p"));
        currentParagraphIndex=0;
        btnAudioEl.style.display="block";
        btnAudioEl.classList.remove("speaking");
        btnAudioEl.style.border="2px solid transparent";

        // Ajuste cuadro IA más grande
        screenContainer.style.maxHeight = "60vh";
        screenContainer.style.minHeight = "320px";
        screenContainer.style.width = "100%";

        // stop any existing playback
        stopPlaybackAndClear();

      } catch(err){ console.error(err); showError("Error al conectar con el servidor."); }
    }

    buscarBtn.addEventListener("click", ()=>{
      const nombre=(input.value||"").trim().toLowerCase();
      if(!nombre){ alert("Ingresa un nombre de Pokémon"); return; }
      if(window.speechSynthesis) window.speechSynthesis.cancel();
      buscarPokemon(nombre);
    });

    input.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); buscarBtn.click(); } });

    clearBtn.addEventListener("click", ()=>{
      input.value="";
      screen.innerHTML=<p>🔍 Escribe un nombre de Pokémon para comenzar.</p>;
      btnAudioEl.style.display="none";
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border="2px solid transparent";
      paragraphs=[]; paragraphElements=[]; currentParagraphIndex=0; paused=false;
      if(window.speechSynthesis) window.speechSynthesis.cancel();
      stopPlaybackAndClear();
      screenContainer.style.maxHeight = "50vh";
      screenContainer.style.minHeight = "280px";
      screenContainer.style.width = "100%";
    });

    // Forzar unlock de audio APIs en AppCreator24
    let speechInitialized = false;
    document.body.addEventListener("click", function initDummySpeech() {
      if (speechInitialized) return;
      try {
        const u = new SpeechSynthesisUtterance("");
        u.lang = "es-ES";
        window.speechSynthesis.speak(u);
        window.speechSynthesis.cancel();
      } catch(e) {}
      speechInitialized = true;
      document.body.removeEventListener("click", initDummySpeech);
    });

    /*******
     * PAYPAL (popup) - render del botón
     *******/
    // Render del botón PayPal dentro del POPUP (misma config que tu original)
    paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe'
      },
      createSubscription: function(data, actions) {
        return actions.subscription.create({
          plan_id: 'P-08M86817PK1059649NEOAHEY'
        });
      },
      onApprove: function(data, actions) {
        usuarioSuscrito = true;
        alert("Suscripción activada");
        popup.style.display = "none";
      }
    }).render('#paypal-button-container-P-08M86817PK1059649NEOAHEY');

    cerrarPopup.addEventListener("click", ()=>{ popup.style.display = "none"; });

    /*******
     * Integración TTS via backend /api/audio (Cloudinary + UnrealSpeech)
     * - Llamada al backend: POST /api/audio { text: "..." }
     * - Backend responde: { success:true, audioUrl, bytes }
     * - Reproduce audio, sincroniza resaltado por párrafos usando duración y proporciones.
     *******/
    btnAudioEl.addEventListener("click", async ()=> {
      if(!paragraphs.length) return;

      // Si no está suscrito: mostrar popup. (pero seguimos generando audio PARA PRUEBAS)
      if(!usuarioSuscrito) {
        popup.style.display = "flex";
      }

      // Si ya hay reproducción activa, togglear pause/resume
      if(isPlayingViaAudioFile) {
        if(!audioPlayer.paused) {
          audioPlayer.pause();
          paused = true;
          btnAudioEl.classList.remove("speaking");
          btnAudioEl.style.border="2px solid transparent";
          stopHighlightSyncTimers();
        } else {
          audioPlayer.play().catch(e=>console.warn(e));
          paused = false;
          btnAudioEl.classList.add("speaking");
          btnAudioEl.style.border="2px solid #00f0ff";
          startHighlightSyncTimers(); // resume sync
        }
        return;
      }

      // No playback -> generar audio a partir de todo el texto (usamos paragraphs)
      const fullText = paragraphs.join("\n\n");
      await generarAudioYReproducir(fullText);
    });

    async function generarAudioYReproducir(texto) {
      try {
        // mostrar feedback (puedes adaptar UI)
        btnAudioEl.textContent = "⏳ Generando audio...";
        btnAudioEl.style.display = "block";

        const resp = await fetch("/api/audio", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ text: texto }) // tu backend espera { text }
        });

        const raw = await resp.text();
        let data;
        try { data = JSON.parse(raw); } catch(e){ console.error("Respuesta no JSON:", raw); showError("Respuesta no válida del servidor."); btnAudioEl.textContent="🔊 Leer"; return; }

        console.log("Respuesta del backend:", data);

        if(!data.success || !data.audioUrl) {
          console.warn("Error backend TTS:", data);
          showError(data.error || "Error en backend TTS");
          btnAudioEl.textContent="🔊 Leer";
          return;
        }

        // preparamos audio
        isPlayingViaAudioFile = true;
        paused = false;
        audioPlayer.style.display = "block";
        audioPlayer.src = data.audioUrl;
        audioPlayer.type = "audio/mpeg";
        audioPlayer.load();

        // cuando metadata cargue, sincronizamos
        audioPlayer.onloadedmetadata = () => {
          const duration = audioPlayer.duration || 0;
          startHighlightSync(paragraphs, duration);
          audioPlayer.play().catch(err=>console.warn("Play error:", err));
          btnAudioEl.classList.add("speaking");
          btnAudioEl.style.border="2px solid #00f0ff";
          btnAudioEl.textContent = "⏸ Detener/Reanudar";
        };

        audioPlayer.onerror = (e) => {
          console.error("Error audioPlayer:", e);
          showError("No se pudo cargar el audio.");
          btnAudioEl.textContent="🔊 Leer";
          isPlayingViaAudioFile = false;
        };

        audioPlayer.onended = () => {
          // terminar limpieza
          stopPlaybackAndClear();
        };

        // mostrar bytes si vienen (debug)
        if(data.bytes) console.log(📏 Tamaño del audio generado: ${data.bytes} bytes);

      } catch(err) {
        console.error(err);
        showError("Error al generar audio: " + (err.message||err));
        btnAudioEl.textContent="🔊 Leer";
        isPlayingViaAudioFile = false;
      }
    }

    /*******
     * Sincronización de resaltado basada en duración del audio
     * Estrategia:
     *  - Calcular pesos por longitud de párrafo
     *  - Mapear cada párrafo a un intervalo de tiempo proporcional
     *  - En cada tick, resaltar el párrafo correspondiente según audio.currentTime
     *******/
    function startHighlightSync(paras, duration) {
      stopHighlightSyncTimers();

      // protección
      if(!paras || paras.length===0 || !duration || duration <= 0) {
        // si no hay duración o es 0 -> solo resaltar secuencialmente con tiempos fijos
        sequentialHighlightFallback(paras);
        return;
      }

      // calcular pesos (longitud)
      const lengths = paras.map(p => p.length || 1);
      const total = lengths.reduce((a,b)=>a+b, 0);
      // generar time windows
      const windows = [];
      let acc = 0;
      for(let i=0;i<paras.length;i++){
        const start = acc / total * duration;
        acc += lengths[i];
        const end = acc / total * duration;
        windows.push({start, end});
      }

      // función que en cada tick comprueba currentTime
      syncTimer = setInterval(()=> {
        const t = audioPlayer.currentTime;
        let idx = windows.findIndex(w => t >= w.start && t < w.end);
        if(idx === -1) {
          if(t >= duration - 0.05) idx = paras.length - 1; // final
        }
        if(idx !== -1 && idx !== currentParagraphIndex) {
          currentParagraphIndex = idx;
          updateHighlight();
        }
      }, 120);

      // inicio: asegurar highlight en índice 0
      currentParagraphIndex = 0;
      updateHighlight();
    }

    function updateHighlight(){
      paragraphElements.forEach((p,i)=> {
        if(i === currentParagraphIndex) {
          p.classList.add("highlight");
          p.scrollIntoView({behavior:"smooth", block:"center"});
        } else p.classList.remove("highlight");
      });
    }

    function stopHighlightSyncTimers(){
      if(syncTimer) { clearInterval(syncTimer); syncTimer = null; }
      if(highlightTimer) { clearInterval(highlightTimer); highlightTimer = null; }
    }

    function sequentialHighlightFallback(paras){
      // Si no hay duración válido, mostramos cada párrafo por 1s approximado
      stopHighlightSyncTimers();
      let i=0;
      if(!paras || paras.length===0) return;
      highlightTimer = setInterval(()=> {
        paragraphElements.forEach(p=>p.classList.remove("highlight"));
        if(i < paragraphElements.length) {
          paragraphElements[i].classList.add("highlight");
          paragraphElements[i].scrollIntoView({behavior:"smooth", block:"center"});
          i++;
        } else {
          clearInterval(highlightTimer);
        }
      }, 900);
    }

    function stopPlaybackAndClear(){
      // stop audio
      try { audioPlayer.pause(); audioPlayer.currentTime = 0; } catch(e){}
      // reset flags and UI
      isPlayingViaAudioFile = false;
      paused = false;
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border="2px solid transparent";
      btnAudioEl.textContent = "🔊 Leer";
      stopHighlightSyncTimers();
      // clear highlights
      paragraphElements.forEach(p=>p.classList.remove("highlight"));
      currentParagraphIndex = 0;
    }

    /*******
     * Si el usuario busca otro Pokémon: detener la reproducción
     *******/
    // buscarPokemon ya llama stopPlaybackAndClear() al iniciar
    // clearBtn también lo hace

  })();
  </script>
</body>
</html>
