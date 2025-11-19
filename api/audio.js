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

    #debug {
      margin-top: 12px;
      width: 95%;
      max-width: 600px;
      background: #111;
      padding: 8px 12px;
      border-radius: 8px;
      height: 120px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      border: 1px solid #333;
      display: none; /* puedes mostrar para depuración */
    }

    @media (max-width:420px) {
      .wrapper{ max-width:320px; }
      .pokemon-img{ width:140px; height:140px; }
      .screen-container { min-height:240px; max-height:55vh; width:100%; }
      input[type="text"], .btnBuscar, .btnClear, #btnAudio { font-size:1rem; padding:10px 12px; }
    }

    /* POPUP */
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
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
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

      <!-- debug box (oculto por defecto) -->
      <div id="debug">Zona de depuración activa...</div>
    </div>
  </div>

  <div class="rayo r1"></div>
  <div class="rayo r2"></div>
  <div class="rayo r3"></div>

  <!-- POPUP SUSCRIPCION -->
  <div id="popupPago">
    <div id="popupContent">
      <h2>🔥 Versión Premium de Voz</h2>
      <p>Suscríbete por solo <b>$3/mes</b> y usa la voz ilimitadamente.</p>

      <!-- BOTÓN DE PAYPAL (igual que el original) -->
      <div id="paypal-button-container-P-08M86817PK1059649NEOAHEY"></div>

      <button id="cerrarPopup">Cerrar</button>
    </div>
  </div>

  <!-- PayPal SDK (mantén tu client-id aquí) -->
  <script src="https://www.paypal.com/sdk/js?client-id=Ad_Nq8cC1wRiz9DlMOZs9AhIH1caG4HS3mRC9EcOqLuqYVByBtlD2KuZcmA7oHgFmo47q5NLZu4sbfoc&vault=true&intent=subscription"></script>

  <!-- Aquí va el puente + lógica que integra tu audio.js con la UI actual -->
  <script>
  (function(){
    // ---------- ELEMENTOS ----------
    const input = document.getElementById('pokemonInput');
    const buscarBtn = document.getElementById('buscarBtn');
    const clearBtn = document.getElementById('clearBtn');
    const screen = document.getElementById('screen');
    const screenContainer = document.getElementById('screenContainer');
    const btnAudioEl = document.getElementById('btnAudio');
    const debugBox = document.getElementById('debug');
    const popupPago = document.getElementById('popupPago');
    const cerrarPopup = document.getElementById('cerrarPopup');
    const audioPlayer = document.createElement('audio'); // audio element usado para reproducir el mp3 del backend
    audioPlayer.id = 'audioPlayer';
    audioPlayer.controls = true;
    audioPlayer.style.display = 'none'; // no mostrar si no quieres
    document.body.appendChild(audioPlayer);

    // ---------- ESTADO ----------
    let paragraphs = [], paragraphElements = [], currentParagraphIndex = 0;
    let highlightTimer = null;
    let scheduledHighlightTimeouts = [];
    let usuarioSuscrito = false; // control local (debes cambiarlo con backend cuando corresponda)
    let isPlayingViaServer = false; // si estamos reproduciendo el mp3 descargado
    let lastGeneratedAudioUrl = null;

    // ---------- UTIL ----------
    function esc(s){ return s?String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""; }
    function log(msg){
      console.log(msg);
      if(debugBox){
        debugBox.style.display = 'block';
        debugBox.textContent += \n${msg};
        debugBox.scrollTop = debugBox.scrollHeight;
      }
    }
    function clearHighlights(){
      paragraphElements.forEach(p=>p.classList.remove('highlight'));
      paragraphElements = [];
      if(screenContainer) screenContainer.scrollTop = 0;
      scheduledHighlightTimeouts.forEach(t => clearTimeout(t));
      scheduledHighlightTimeouts = [];
      clearInterval(highlightTimer);
      highlightTimer = null;
    }

    // ---------- PARSE & UI ----------
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

    // ---------- BÚSQUEDA ----------
    function showLoading(name){
      // si hay reproducción nativa, cancelarla
      stopAllPlayback();
      screen.innerHTML = <p>🔎 Buscando información sobre <strong>${esc(name)}</strong>...</p>;
      btnAudioEl.style.display="none";
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border="2px solid transparent";
      clearHighlights();
    }

    function showError(msg){
      stopAllPlayback();
      screen.innerHTML = <p>❌ ${esc(msg)}</p>;
      btnAudioEl.style.display="none";
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border="2px solid transparent";
      clearHighlights();
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
        currentParagraphIndex = 0;
        btnAudioEl.style.display="block";
        btnAudioEl.classList.remove("speaking");
        btnAudioEl.style.border="2px solid transparent";
        // stop any existing playback
        stopAllPlayback();

        // Ajuste cuadro IA más grande
        screenContainer.style.maxHeight = "60vh";
        screenContainer.style.minHeight = "320px";
        screenContainer.style.width = "100%";

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
      clearHighlights();
      screenContainer.style.maxHeight = "50vh";
      screenContainer.style.minHeight = "280px";
      screenContainer.style.width = "100%";
    });

    // ---------- INICIALIZACION VOZ PARA APP (mantener) ----------
    let speechInitialized = false;
    document.body.addEventListener("click", function initDummySpeech() {
      if (speechInitialized) return;
      if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function") {
        const u = new SpeechSynthesisUtterance("");
        u.lang = "es-ES";
        window.speechSynthesis.speak(u);
        window.speechSynthesis.cancel();
        speechInitialized = true;
        log("SpeechSynthesis inicializado para AppCreator24");
      }
      document.body.removeEventListener("click", initDummySpeech);
    });

    // ---------- FUNCIONES DE REPRODUCCION / HIGHLIGHT (por servidor) ----------
    function stopAllPlayback(){
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch(e){}
      // stop audio element
      if(!audioPlayer.paused) audioPlayer.pause();
      audioPlayer.src = "";
      isPlayingViaServer = false;
      clearHighlights();
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border = "2px solid transparent";
    }

    function scheduleHighlightsByDuration(totalDuration){
      // heurística: repartir duración según longitud de cada paragraph
      scheduledHighlightTimeouts.forEach(t => clearTimeout(t));
      scheduledHighlightTimeouts = [];
      if(!paragraphElements.length) return;
      const lengths = paragraphElements.map(p=>p.textContent.length);
      const totalChars = lengths.reduce((a,b)=>a+b,0) || 1;
      let acc = 0;
      let startAt = audioPlayer.currentTime || 0;
      for(let i=0;i<paragraphElements.length;i++){
        const proportion = lengths[i]/totalChars;
        const dur = proportion * totalDuration;
        const when = Math.max(0, startAt + acc);
        const idx = i;
        const t = setTimeout(()=>{
          paragraphElements.forEach(p=>p.classList.remove('highlight'));
          const el = paragraphElements[idx];
          if(el){
            el.classList.add('highlight');
            try{ el.scrollIntoView({behavior:"smooth", block:"center"}); }catch(e){}
          }
        }, when*1000);
        scheduledHighlightTimeouts.push(t);
        acc += dur;
      }
      // after all, clear highlights and reset
      const endT = setTimeout(()=>{
        paragraphElements.forEach(p=>p.classList.remove('highlight'));
        btnAudioEl.classList.remove("speaking");
        btnAudioEl.style.border = "2px solid transparent";
        audioPlayer.currentTime = 0;
        audioPlayer.pause();
        isPlayingViaServer = false;
      }, (startAt + acc)*1000 + 300);
      scheduledHighlightTimeouts.push(endT);
    }

    // ---------- BRIDGE: cuando el backend responde con audioUrl, reproducir y sincronizar highlights ----------
    // Llamará a generarAudio(text) en tu audio.js frontend; esa función debería finalmente setear audioPlayer.src = url
    // pero por robustez interceptamos el evento "loadedmetadata" del audio player para saber duración y sincronizar.
    audioPlayer.addEventListener('loadedmetadata', ()=>{
      const dur = audioPlayer.duration;
      log(Duración audio (mp3): ${isFinite(dur) ? dur.toFixed(2) + 's' : 'desconocida'});
      // reiniciar highlights y planificar
      clearHighlights();
      if(isFinite(dur) && dur>0){
        scheduleHighlightsByDuration(dur);
      } else {
        // si no hay duración, usar heurística basada en text length -> estimar 150 wpm
        const totalChars = paragraphs.join(' ').length;
        const approxSec = Math.max(2, (totalChars/6) / (150/60)); // approx: words ~ chars/6 ; words per sec = 150/60
        scheduleHighlightsByDuration(approxSec);
      }
    });

    audioPlayer.addEventListener('play', ()=>{
      btnAudioEl.classList.add("speaking");
      btnAudioEl.style.border = "2px solid #00f0ff";
      isPlayingViaServer = true;
    });

    audioPlayer.addEventListener('pause', ()=>{
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border = "2px solid transparent";
      // pause scheduled timeouts -- cannot pause setTimeout, so we'll clear and reschedule on resume
      scheduledHighlightTimeouts.forEach(t => clearTimeout(t));
      scheduledHighlightTimeouts = [];
    });

    audioPlayer.addEventListener('ended', ()=>{
      clearHighlights();
      btnAudioEl.classList.remove("speaking");
      btnAudioEl.style.border = "2px solid transparent";
      isPlayingViaServer = false;
      audioPlayer.currentTime = 0;
    });

    // ---------- PAYPAL: render en popup ----------
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
        popupPago.style.display = "none";
      }
    }).render('#paypal-button-container-P-08M86817PK1059649NEOAHEY');

    cerrarPopup.addEventListener("click", ()=> popupPago.style.display = "none");

    // ---------- BOTÓN LEER (integración) ----------
    // Reemplaza el comportamiento del btnAudioEl: mostrar popup si no suscrito, y generar audio siempre
    btnAudioEl.addEventListener('click', async ()=>{
      if(!paragraphs.length) return;

      // si audio ya está reproduciéndose, pausa/resume
      if(isPlayingViaServer && !audioPlayer.paused){
        audioPlayer.pause();
        return;
      } else if(isPlayingViaServer && audioPlayer.paused){
        audioPlayer.play().catch(err => log("Error al reanudar audio: "+err.message));
        return;
      }

      // else: iniciar nueva reproducción (llama al backend TTS)
      const fullText = paragraphs.join(' ');
      // Si no suscrito, mostrar popup (pero *NO impedir* la generación)
      if(!usuarioSuscrito){
        popupPago.style.display = "flex";
      }

      // Llamamos a la función global generarAudio(text) que está en tu audio.js frontend.
      // Tu audio.js debe:
      //  - POST a /api/audio con { text: ... }
      //  - recibir respuesta con audioUrl (key audioUrl)
      //  - y asignar audioPlayer.src = audioUrl (o devolver la url)
      // Para fiabilidad, intentamos llamar y también capturar la respuesta por fetch aquí si la función no la setea.
      try {
        if(typeof generarAudio === 'function'){
          // llamar la función (asíncrona)
          // generarAudio en tu audio.js anterior espera { text } y escribe logs y reproducirá audio.
          await generarAudio(fullText);
          // esperamos que audioPlayer.src sea puesto por audio.js. Como respaldo, si después de 1s no se ha establecido, intenta llamar el backend directamente aquí.
          setTimeout(()=>{
            if(!audioPlayer.src && lastGeneratedAudioUrl){
              audioPlayer.src = lastGeneratedAudioUrl;
              audioPlayer.play().catch(err => log("Error al reproducir (respaldo): "+err.message));
            }
          },1200);
        } else {
          log("⚠️ generarAudio() no disponible, se intenta llamada directa al backend.");
          // fallback: llamar backend directamente
          const response = await fetch('/api/audio', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ text: fullText })
          });
          const raw = await response.text();
          let data;
          try { data = JSON.parse(raw); } catch(e){ log("Respuesta no JSON: "+raw); return; }
          if(data && data.success && (data.audioUrl || data.url)){
            const audioUrl = data.audioUrl || data.url;
            lastGeneratedAudioUrl = audioUrl;
            audioPlayer.src = audioUrl;
            audioPlayer.play().catch(err=>log("Error al reproducir (fallback): "+err.message));
          } else {
            log("Error backend TTS: "+(data && data.error ? data.error : "sin audioUrl"));
          }
        }
      } catch(err){
        log("💥 Error al generar audio desde bridge: " + err.message);
      }
    });

    // ---------- PARA PRUEBAS: EXPOSE función para generar y reproducir desde otros scripts ----------
    // (opcional — útil si tu audio.js hace return de url en vez de reproducir)
    window._bridgeSetAudioUrl = function(url){
      if(!url) return;
      lastGeneratedAudioUrl = url;
      audioPlayer.src = url;
      audioPlayer.play().catch(err=>log("Error al reproducir (bridge set): "+err.message));
    };

    // ---------- Si se busca nuevo pokemon, detener audio (ya manejado en buscarPokemon on start) ----------

    // exposición (opcional) a la consola para debugging
    window.__pokeBridge = {
      buscarPokemon,
      stopAllPlayback,
      isSubscribed: ()=>usuarioSuscrito
    };

    // iniciar: nada más
    log("Bridge integrado: UI <-> TTS backend conectado. El botón Leer mostrará popup si no hay suscripción y generará audio para pruebas.");
  })();
  </script>

  <!-- Tu audio.js frontend (debe existir en ./audio.js) -->
  <!-- Este archivo debe exponer la función global generarAudio(text) que POSTea a /api/audio y, al recibir audioUrl, asigna audioPlayer.src o llama a window._bridgeSetAudioUrl(audioUrl)  -->
  <script src="./audio.js"></script>
</body>
</html>
