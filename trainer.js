// ===== TRAINER.JS — Modo Entrenador v2 =====
console.log("[TRAINER] Cargando v2...")

// ══════════════════════════════════════
// PROGRAMAS
// ══════════════════════════════════════
const PROGRAMS = [
  {
    id: "warmup",
    name: "CALENTAMIENTO",
    level: "PRINCIPIANTE",
    duration: 20,
    color: "#39ff14",
    blocks: [
      { zone:1, duration:180, cadMin:60, cadMax:65, position:"Sentado",  msg:"Arranquemos suave, activamos las piernas" },
      { zone:2, duration:240, cadMin:70, cadMax:75, position:"Sentado",  msg:"Subimos un poco, buen ritmo" },
      { zone:3, duration:180, cadMin:80, cadMax:85, position:"Sentado",  msg:"¡Muy bien! Mantené esa cadencia" },
      { zone:2, duration:180, cadMin:70, cadMax:75, position:"Sentado",  msg:"Bajamos un poco, respirá" },
      { zone:1, duration:240, cadMin:60, cadMax:65, position:"Sentado",  msg:"Enfriamiento, casi terminamos" },
      { zone:1, duration:180, cadMin:55, cadMax:60, position:"Sentado",  msg:"Vuelta a la calma, excelente trabajo" },
    ]
  },
  {
    id: "intervals",
    name: "INTERVALOS",
    level: "AVANZADO",
    duration: 25,
    color: "#ff6a00",
    blocks: [
      { zone:1, duration:180, cadMin:65, cadMax:70, position:"Sentado",  msg:"Calentamos, preparate para los intervalos" },
      { zone:3, duration:120, cadMin:85, cadMax:90, position:"Sentado",  msg:"Subimos el ritmo" },
      { zone:5, duration:60,  cadMin:95, cadMax:100,position:"De pie",   msg:"¡SPRINT! ¡Todo el gas!" },
      { zone:1, duration:120, cadMin:65, cadMax:70, position:"Sentado",  msg:"Recuperación, respirá profundo" },
      { zone:3, duration:120, cadMin:85, cadMax:90, position:"Sentado",  msg:"De nuevo, subimos" },
      { zone:5, duration:60,  cadMin:95, cadMax:100,position:"De pie",   msg:"¡SPRINT! ¡Vamos!" },
      { zone:1, duration:120, cadMin:65, cadMax:70, position:"Sentado",  msg:"Recuperás, muy bien" },
      { zone:4, duration:120, cadMin:90, cadMax:95, position:"De pie",   msg:"Umbral, aguantá el ritmo" },
      { zone:5, duration:60,  cadMin:100,cadMax:110,position:"De pie",   msg:"¡TODO! ¡Último sprint!" },
      { zone:1, duration:240, cadMin:60, cadMax:65, position:"Sentado",  msg:"Enfriamiento, lo diste todo" },
      { zone:1, duration:180, cadMin:55, cadMax:60, position:"Sentado",  msg:"Vuelta a la calma, ¡excelente!" },
    ]
  },
  {
    id: "endurance",
    name: "RESISTENCIA",
    level: "INTERMEDIO",
    duration: 30,
    color: "#00f5ff",
    blocks: [
      { zone:1, duration:240, cadMin:65, cadMax:70, position:"Sentado",  msg:"Activamos, ritmo tranquilo" },
      { zone:2, duration:300, cadMin:75, cadMax:80, position:"Sentado",  msg:"Base aeróbica, respiración controlada" },
      { zone:3, duration:480, cadMin:82, cadMax:88, position:"Sentado",  msg:"Tempo sostenido, mantené este ritmo" },
      { zone:4, duration:300, cadMin:88, cadMax:92, position:"De pie",   msg:"Subimos la presión, ¡fuerza!" },
      { zone:3, duration:240, cadMin:82, cadMax:88, position:"Sentado",  msg:"Bajamos un poco, buen trabajo" },
      { zone:2, duration:120, cadMin:75, cadMax:80, position:"Sentado",  msg:"Casi terminamos" },
      { zone:1, duration:120, cadMin:60, cadMax:65, position:"Sentado",  msg:"Enfriamiento final, ¡lo lograste!" },
    ]
  },
  {
    id: "strength",
    name: "RESISTENCIA Y FUERZA",
    level: "AVANZADO",
    duration: 40,
    color: "#ff00c8",
    blocks: [
      { zone:1, duration:180, cadMin:55, cadMax:65, position:"Sentado",  msg:"Arrancamos suave, activá las piernas" },
      { zone:2, duration:240, cadMin:70, cadMax:75, position:"Sentado",  msg:"Base aeróbica, respiración controlada" },
      { zone:3, duration:300, cadMin:80, cadMax:85, position:"Sentado",  msg:"Subimos el ritmo, mantené la cadencia" },
      { zone:3, duration:360, cadMin:82, cadMax:88, position:"Sentado",  msg:"Tempo sostenido, ¡muy bien!" },
      { zone:1, duration:120, cadMin:60, cadMax:65, position:"Sentado",  msg:"Recuperación activa, respirá" },
      { zone:4, duration:300, cadMin:90, cadMax:95, position:"De pie",   msg:"¡Esfuerzo fuerte! Subí la resistencia" },
      { zone:1, duration:120, cadMin:60, cadMax:65, position:"Sentado",  msg:"Recuperás, casi llegamos" },
      { zone:5, duration:300, cadMin:100,cadMax:110,position:"De pie",   msg:"¡TODO EL GAS! ¡Máximo esfuerzo!" },
      { zone:5, duration:300, cadMin:100,cadMax:110,position:"De pie",   msg:"¡Aguantá! ¡Vos podés! ¡Último bloque!" },
      { zone:1, duration:180, cadMin:55, cadMax:60, position:"Sentado",  msg:"Vuelta a la calma, ¡EXCELENTE sesión!" },
    ]
  }
]

const ZONES = {
  1: { name:"Muy ligero",  color:"#3b82f6", bg:"rgba(59,130,246,.15)"  },
  2: { name:"Ligero",      color:"#39ff14", bg:"rgba(57,255,20,.15)"   },
  3: { name:"Moderado",    color:"#facc15", bg:"rgba(250,204,21,.15)"  },
  4: { name:"Duro",        color:"#f97316", bg:"rgba(249,115,22,.15)"  },
  5: { name:"Máximo",      color:"#ef4444", bg:"rgba(239,68,68,.15)"   },
}

// ══════════════════════════════════════
// ESTADO
// ══════════════════════════════════════
let ts = {
  active:       false,
  program:      null,
  blockIndex:   0,
  blockElapsed: 0,    // segundos acumulados EN ESTE BLOQUE
  totalElapsed: 0,    // segundos totales
  timer:        null,
  // Cadencia
  clickTimes:   [],
  currentRPM:   0,
  lastClickMs:  0,
  // Control de avance
  pedalingNow:  false,  // true si hubo click en los últimos 2.5s
}

// ══════════════════════════════════════
// CADENCIA — se llama en cada pedaleo
// ══════════════════════════════════════
function recordPedal() {
  if (!ts.active) return

  const now = Date.now()
  ts.lastClickMs = now
  ts.pedalingNow = true
  ts.clickTimes.push(now)
  if (ts.clickTimes.length > 8) ts.clickTimes.shift()

  // Calcular RPM
  if (ts.clickTimes.length >= 2) {
    const times = ts.clickTimes
    const span  = times[times.length - 1] - times[0]
    const avg   = span / (times.length - 1)
    ts.currentRPM = Math.min(200, Math.round(60000 / avg))
  }

  updateRPMDisplay()
  updateRPMFeedback()
  updateAvatarAnimation()
}

// Decay — si no hay click en 2.5s, RPM cae y el tiempo se congela
setInterval(() => {
  if (!ts.active) return
  const elapsed = Date.now() - ts.lastClickMs
  if (elapsed > 2500) {
    ts.pedalingNow = false
    ts.currentRPM  = Math.max(0, ts.currentRPM - 8)
    updateRPMDisplay()
    updateRPMFeedback()
    updateAvatarAnimation()
  }
}, 300)

// ══════════════════════════════════════
// ARRANCAR PROGRAMA
// ══════════════════════════════════════
function startTrainer(programId) {
  const program = PROGRAMS.find(p => p.id === programId)
  if (!program) return

  ts = {
    active:       true,
    program,
    blockIndex:   0,
    blockElapsed: 0,
    totalElapsed: 0,
    timer:        null,
    clickTimes:   [],
    currentRPM:   0,
    lastClickMs:  Date.now(),
    pedalingNow:  false,
  }

  window._trainerActive = true
  showPage("trainerSession")
  frameIndex = 0

  // Pequeño delay para asegurar que el DOM ya tiene dimensiones reales
  // (la página recién se hizo visible, clientWidth puede ser 0 al instante)
  setTimeout(() => {
    selectSprite(currentGender)
    const initBlock = program.blocks[0]
    if (initBlock) updateSpriteSpeed(initBlock)
    updateAvatarAnimation()
  }, 60)

  buildProgramChart(program)
  updateBlockDisplay()
  showTrainerMessage(program.blocks[0].msg, true)

  // Tick cada 1 segundo — pero solo avanza si está pedaleando
  ts.timer = setInterval(trainerTick, 1000)
}

// ══════════════════════════════════════
// TICK — corazón del entrenamiento
// ══════════════════════════════════════
function trainerTick() {
  if (!ts.active) return

  const block = ts.program.blocks[ts.blockIndex]

  // ── Solo avanza el tiempo si está pedaleando ──
  if (ts.pedalingNow) {
    ts.blockElapsed++
    ts.totalElapsed++
  }

  // ── Cambio de bloque ──
  if (ts.blockElapsed >= block.duration) {
    ts.blockIndex++
    ts.blockElapsed = 0

    if (ts.blockIndex >= ts.program.blocks.length) {
      endTrainer()
      return
    }

    const next = ts.program.blocks[ts.blockIndex]
    updateBlockDisplay()
    showTrainerMessage(next.msg, true)
    updateChartProgress()
  }

  updateTimers()
  updateRPMFeedback()
  updateChartProgress()
  updateAvatarAnimation()
}

// ══════════════════════════════════════
// DISPLAY
// ══════════════════════════════════════
function updateBlockDisplay() {
  const block = ts.program.blocks[ts.blockIndex]
  const zone  = ZONES[block.zone]
  updateSpriteSpeed(block)

  const zoneEl = document.getElementById("trZone")
  if (zoneEl) {
    zoneEl.textContent = `ZONA ${block.zone} — ${zone.name.toUpperCase()}`
    zoneEl.style.color = zone.color
    zoneEl.style.textShadow = `0 0 12px ${zone.color}`
  }

  const effortEl = document.getElementById("trEffort")
  if (effortEl) effortEl.textContent = zone.name.toUpperCase()

  const cadEl = document.getElementById("trCadTarget")
  if (cadEl) cadEl.textContent = `${block.cadMin}–${block.cadMax}`

  const posEl = document.getElementById("trPosition")
  if (posEl) posEl.textContent = block.position.toUpperCase()

  const hudEl = document.getElementById("trainerHUD")
  if (hudEl) hudEl.style.borderColor = zone.color + "55"

  document.querySelectorAll(".chart-bar").forEach((bar, i) => {
    bar.classList.toggle("active-bar", i === ts.blockIndex)
  })
}

function updateTimers() {
  const block     = ts.program.blocks[ts.blockIndex]
  const blockLeft = block.duration - ts.blockElapsed
  const totalSecs = ts.program.duration * 60
  const totalLeft = totalSecs - ts.totalElapsed

  const blEl = document.getElementById("trBlockTime")
  if (blEl) blEl.textContent = formatTime(Math.max(0, blockLeft))

  const totEl = document.getElementById("trTotalTime")
  if (totEl) totEl.textContent = formatTime(Math.max(0, totalLeft))

  const pct = (ts.totalElapsed / totalSecs) * 100
  const progEl = document.getElementById("trProgressFill")
  if (progEl) progEl.style.width = Math.min(100, pct) + "%"

  // Indicador de pausa
  const pauseEl = document.getElementById("trPauseIndicator")
  if (pauseEl) {
    pauseEl.style.opacity = ts.pedalingNow ? "0" : "1"
  }
}

function updateRPMDisplay() {
  const rpmEl = document.getElementById("trRPM")
  if (rpmEl) {
    rpmEl.textContent = ts.currentRPM > 0 ? ts.currentRPM : "—"
  }
}

function updateRPMFeedback() {
  const fbEl = document.getElementById("trRPMFeedback")
  if (!fbEl) return

  const block = ts.program.blocks[ts.blockIndex]
  const rpm   = ts.currentRPM

  if (!ts.pedalingNow || rpm === 0) {
    fbEl.textContent = "⏸ PAUSA — ¡Pedalea para avanzar!"
    fbEl.style.color = "#3a4570"
  } else if (rpm < block.cadMin - 3) {
    fbEl.textContent = `↑ Subí el ritmo (${block.cadMin}–${block.cadMax} RPM)`
    fbEl.style.color = "#f97316"
  } else if (rpm > block.cadMax + 3) {
    fbEl.textContent = `↓ Bajá un poco (${block.cadMin}–${block.cadMax} RPM)`
    fbEl.style.color = "#facc15"
  } else {
    fbEl.textContent = "✓ ¡Perfecto! Seguí así"
    fbEl.style.color = "#39ff14"
  }
}

let msgTimeout = null
function showTrainerMessage(msg, animate = false) {
  const el = document.getElementById("trMessage")
  if (!el) return
  if (animate) {
    el.style.opacity = "0"
    el.style.transform = "translateY(8px)"
    clearTimeout(msgTimeout)
    msgTimeout = setTimeout(() => {
      el.textContent = msg
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    }, 300)
  } else {
    el.textContent = msg
  }
}

// ══════════════════════════════════════
// GRÁFICO
// ══════════════════════════════════════
// Renderiza TODA la rutina como barras — una por bloque, coloreada por zona.
// La barra del bloque activo se resalta con glow y mayor opacidad.
function renderFullRoutineBars() {
  const container = document.getElementById('trHudZonaBars')
  if (!container || !ts.program) return

  const zoneColors = {1:'#3b82f6',2:'#39ff14',3:'#facc15',4:'#f97316',5:'#ef4444'}
  const blocks = ts.program.blocks
  const maxDur = Math.max(...blocks.map(b => b.duration))

  // Solo reconstruir si cambió el programa (evita recrear cada tick)
  if (container.dataset.programId !== ts.program.id) {
    container.innerHTML = ''
    container.dataset.programId = ts.program.id

    blocks.forEach((b, i) => {
      const widthPct = (b.duration / maxDur) * 100
      const bar = document.createElement('div')
      bar.className = 'routine-bar'
      bar.dataset.idx = i
      bar.style.cssText = `
        flex: ${b.duration};
        min-width: 4px;
        height: 100%;
        border-radius: 3px;
        background: ${zoneColors[b.zone]};
        opacity: .35;
        transition: opacity .3s, box-shadow .3s, transform .3s;
        align-self: stretch;
      `
      container.appendChild(bar)
    })
  }

  // Actualizar estado visual: pasado / activo / futuro
  container.querySelectorAll('.routine-bar').forEach((bar, i) => {
    if (i < ts.blockIndex) {
      bar.style.opacity = '.2'
      bar.style.boxShadow = 'none'
      bar.style.transform = 'scaleY(.7)'
    } else if (i === ts.blockIndex) {
      const c = zoneColors[blocks[i].zone]
      bar.style.opacity = '1'
      bar.style.boxShadow = `0 0 8px ${c}, 0 0 16px ${c}66`
      bar.style.transform = 'scaleY(1)'
    } else {
      bar.style.opacity = '.4'
      bar.style.boxShadow = 'none'
      bar.style.transform = 'scaleY(.85)'
    }
  })
}
window.renderFullRoutineBars = renderFullRoutineBars

function buildProgramChart(program) {
  const container = document.getElementById("trChart")
  if (!container) return
  container.innerHTML = ""

  const maxDur = Math.max(...program.blocks.map(b => b.duration))

  program.blocks.forEach((block, i) => {
    const zone   = ZONES[block.zone]
    const height = 15 + (block.zone / 5) * 82
    const width  = Math.max(20, (block.duration / maxDur) * 80)

    const bar = document.createElement("div")
    bar.className = "chart-bar"
    bar.style.cssText = `
      height:${height}%; width:${width}px; min-width:16px;
      background:${zone.color}; border-radius:3px 3px 0 0;
      transition:opacity .3s, box-shadow .3s;
      cursor:pointer; position:relative; align-self:flex-end; flex-shrink:0;
    `
    bar.title = `Zona ${block.zone} · ${formatTime(block.duration)}`
    container.appendChild(bar)
  })
}

function updateChartProgress() {
  document.querySelectorAll(".chart-bar").forEach((bar, i) => {
    if (i < ts.blockIndex) {
      bar.style.opacity = "0.25"
      bar.style.boxShadow = "none"
    } else if (i === ts.blockIndex) {
      const zone = ZONES[ts.program.blocks[i].zone]
      bar.style.opacity = "1"
      bar.style.boxShadow = `0 0 14px ${zone.color}`
    } else {
      bar.style.opacity = "0.65"
      bar.style.boxShadow = "none"
    }
  })
}

// ══════════════════════════════════════
// FIN
// ══════════════════════════════════════
function endTrainer() {
  ts.active = false
  window._trainerActive = false
  clearInterval(ts.timer)
  stopSpriteAnimation()
  showTrainerMessage("¡SESIÓN COMPLETADA! ¡Excelente trabajo! 🏆", true)
  setTimeout(() => {
    showPage("trainerResults")
    showTrainerResults()
  }, 2500)
}

function showTrainerResults() {
  const program = ts.program
  const totalSecs = ts.totalElapsed
  const el = document.getElementById("trainerResultsContent")
  if (!el) return

  el.innerHTML = `
    <div style="text-align:center; margin-bottom:20px;">
      <div style="font-size:3rem; margin-bottom:8px;">🏆</div>
      <div class="orb" style="font-size:1.1rem; color:var(--green); text-shadow:0 0 12px var(--green);">¡SESIÓN COMPLETADA!</div>
      <div class="label-sm" style="margin-top:6px;">${program.name} · ${program.duration} MIN</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px;">
      <div class="panel" style="padding:14px; text-align:center;">
        <div class="orb" style="font-size:1.4rem; color:var(--cyan);">${formatTime(totalSecs)}</div>
        <div class="label-sm">TIEMPO ACTIVO</div>
      </div>
      <div class="panel" style="padding:14px; text-align:center;">
        <div class="orb" style="font-size:1.4rem; color:var(--orange);">${ts.blockIndex + 1}/${program.blocks.length}</div>
        <div class="label-sm">BLOQUES</div>
      </div>
    </div>
  `
}

function stopTrainer() {
  ts.active = false
  window._trainerActive = false
  clearInterval(ts.timer)
  stopSpriteAnimation()
  showPage("trainerMenu")
}

// ══════════════════════════════════════
// UTILS
// ══════════════════════════════════════
function formatTime(secs) {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, "0")
  const s = (Math.abs(secs) % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

// ══════════════════════════════════════
// SPRITE SHEET — M: 266x686px, F: 266x686px
// 6 cols x 6 rows = 36 frames each
// ══════════════════════════════════════
const SPRITES = {
  m: { file:'public/trainer-sprite-m.png', fw:190, fh:544, cols:6, rows:6, totalW:1140, totalH:3264 },
  f: { file:'public/trainer-sprite-f.png', fw:266, fh:686, cols:6, rows:6, totalW:1596, totalH:4116 },
}
let currentGender = 'm'
let frameIndex    = 0
let frameInterval = null

// Calcula el tamaño del sprite para que ocupe el contenedor disponible
// manteniendo el aspect ratio correcto del personaje (evita el bug
// de clamp() anidado dentro de calc() en background-size)
function resizeSprite() {
  const sp     = SPRITES[currentGender]
  const wrap   = document.getElementById('trainerSpriteWrap')
  const sprite = document.getElementById('trainerSprite')
  if (!wrap || !sprite) return

  const wrapW = wrap.clientWidth  || 200
  const wrapH = wrap.clientHeight || 400
  const aspect = sp.fh / sp.fw  // alto/ancho de un frame

  // Probar ajustando por alto disponible
  let dispH = wrapH * 0.96
  let dispW = dispH / aspect

  // Si se pasa del ancho disponible, ajustar por ancho
  const maxW = wrapW * 0.9
  if (dispW > maxW) {
    dispW = maxW
    dispH = dispW * aspect
  }

  const scale = dispW / sp.fw
  const bgW   = sp.totalW * scale
  const bgH   = sp.totalH * scale

  sprite.style.width           = dispW + 'px'
  sprite.style.height          = dispH + 'px'
  sprite.style.backgroundSize  = `${bgW}px ${bgH}px`

  setFrame(frameIndex)
}
window.resizeSprite = resizeSprite

function selectSprite(gender) {
  currentGender = gender
  const sp = SPRITES[gender]
  const el = document.getElementById('trainerSprite')
  if (el) el.style.backgroundImage = `url('${sp.file}')`

  // Update selector buttons
  const bm = document.getElementById('btnSpriteM')
  const bf = document.getElementById('btnSpriteF')
  if (bm && bf) {
    if (gender === 'm') {
      bm.style.borderColor='rgba(0,245,255,.6)'; bm.style.background='rgba(0,245,255,.18)'; bm.style.color='#00f5ff'
      bf.style.borderColor='rgba(255,255,255,.25)'; bf.style.background='rgba(0,0,0,.4)'; bf.style.color='rgba(255,255,255,.5)'
    } else {
      bf.style.borderColor='rgba(255,0,200,.6)'; bf.style.background='rgba(255,0,200,.18)'; bf.style.color='#ff00c8'
      bm.style.borderColor='rgba(255,255,255,.25)'; bm.style.background='rgba(0,0,0,.4)'; bm.style.color='rgba(255,255,255,.5)'
    }
  }
  frameIndex = 0
  resizeSprite()
  const el2 = document.getElementById('trainerSprite')
  if (el2) el2.style.animation = 'none'
}
window.selectSprite = selectSprite

// Re-ajustar el sprite si cambia el tamaño de ventana (rotación, resize)
window.addEventListener('resize', () => { if (window._trainerActive) resizeSprite() })

function setFrame(idx) {
  const sprite = document.getElementById('trainerSprite')
  if (!sprite) return
  const sp = SPRITES[currentGender]
  // Usar el ancho/alto YA escalado del sprite (puesto por resizeSprite)
  const dispW = parseFloat(sprite.style.width)  || sp.fw
  const dispH = parseFloat(sprite.style.height) || sp.fh
  const col = idx % sp.cols
  const row = Math.floor(idx / sp.cols)
  sprite.style.backgroundPosition = `${-(col * dispW)}px ${-(row * dispH)}px`
  sprite.style.animation = 'none'
}

function startSpriteAnimation(intervalMs) {
  if (frameInterval) clearInterval(frameInterval)
  frameInterval = setInterval(() => {
    frameIndex = (frameIndex + 1) % 36
    setFrame(frameIndex)
  }, intervalMs)
  if (frameInterval) frameInterval._ms = intervalMs
}

// Zone-based speed table — recalibrado para sensación real de pedaleo
// A mayor zona, el instructor pedalea visiblemente mucho más rápido
function updateSpriteSpeed(block) {
  if (!block) return
  const zoneSpeedMs = {
    1: 130,  // Zona 1 — Muy ligero, suave pero visible
    2: 90,   // Zona 2 — Ligero
    3: 60,   // Zona 3 — Moderado
    4: 38,   // Zona 4 — Duro
    5: 22,   // Zona 5 — Máximo, sprint muy rápido
  }
  const intervalMs = zoneSpeedMs[block.zone] || 90
  const curInterval = frameInterval?._ms || 0
  if (!frameInterval || Math.abs(intervalMs - curInterval) > 5) {
    startSpriteAnimation(intervalMs)
  }
}

function stopSpriteAnimation() {
  if (frameInterval) clearInterval(frameInterval)
  frameInterval = null
  // Keep current frame — don't reset to 0 to avoid jump
  const sprite = document.getElementById('trainerSprite')
  if (sprite) sprite.style.animation = 'none'  // completely still when paused
}

function updateAvatarAnimation() {
  const sprite  = document.getElementById('trainerSprite')
  const overlay = document.getElementById('trainerZoneOverlay')
  const floatMsg = document.getElementById('trainerFloatText')
  if (!sprite) return

  const rpm   = ts.currentRPM
  const block = ts.active ? ts.program?.blocks[ts.blockIndex] : null
  const zone  = block ? ZONES[block.zone] : null

  // Instructor animates at zone target cadence — always
  if (block) {
    updateSpriteSpeed(block)
    const glowColor = zone ? zone.color : '#9b59b6'
    sprite.style.filter = `drop-shadow(0 0 24px ${glowColor}88)`
  } else {
    stopSpriteAnimation()
  }

  // ── Overlay zona ──
  if (overlay && zone) {
    overlay.style.background = `radial-gradient(ellipse at 50% 100%, ${zone.color}22, transparent 70%)`
    overlay.style.opacity = ts.pedalingNow ? '1' : '0'
  }

  // ── HUD superpuesto ──
  updateOverlayHUD(block, zone, rpm)

  // ── Mensaje flotante ──
  if (floatMsg && block) {
    if (!ts.pedalingNow) {
      floatMsg.textContent = '⏸ ¡Pedalea para avanzar!'
      floatMsg.style.color = 'rgba(255,255,255,.5)'
    } else if (rpm < block.cadMin - 3) {
      floatMsg.textContent = `↑ Subí a ${block.cadMin}–${block.cadMax} RPM`
      floatMsg.style.color = '#f97316'
    } else if (rpm > block.cadMax + 3) {
      floatMsg.textContent = `↓ Bajá a ${block.cadMin}–${block.cadMax} RPM`
      floatMsg.style.color = '#facc15'
    } else {
      floatMsg.textContent = `✓ ${block.position.toUpperCase()} · ¡Perfecto!`
      floatMsg.style.color = '#39ff14'
    }
  }
}

function updateOverlayHUD(block, zone, rpm) {
  const zoneColors = ['#1e293b','#3b82f6','#39ff14','#facc15','#f97316','#ef4444']

  // RPM actual
  const rpmEl = document.getElementById('trHudRPM')
  if (rpmEl) {
    rpmEl.textContent = rpm > 0 ? rpm : '—'
    rpmEl.style.color = rpm > 0 ? '#00f5ff' : '#3a4570'
    rpmEl.style.textShadow = rpm > 0 ? '0 0 14px #00f5ff' : 'none'
  }

  // Zona + posición (centro top)
  const zoneDisp = document.getElementById('trZoneDisplay')
  if (zoneDisp && block && zone) {
    zoneDisp.textContent = `ZONA ${block.zone} — ${zone.name.toUpperCase()}`
    zoneDisp.style.color = zone.color
    zoneDisp.style.textShadow = `0 0 10px ${zone.color}55`
  }
  const posDisp = document.getElementById('trPositionDisplay')
  if (posDisp && block) posDisp.textContent = block.position.toUpperCase()

  // Luces neón laterales cambian con la zona
  if (zone) {
    const zoneNeons = {
      1: { l:'#3b82f6', r:'#00f5ff' },
      2: { l:'#39ff14', r:'#00f5ff' },
      3: { l:'#facc15', r:'#39ff14' },
      4: { l:'#f97316', r:'#facc15' },
      5: { l:'#ef4444', r:'#f97316' },
    }
    const nc = zoneNeons[block.zone] || zoneNeons[1]
    const nl = document.getElementById('trSessionNeonL')
    const nr = document.getElementById('trSessionNeonR')
    if (nl) { nl.style.background=`linear-gradient(to bottom,transparent,${nc.l},transparent)`; nl.style.boxShadow=`0 0 20px ${nc.l},0 0 50px ${nc.l}55` }
    if (nr) { nr.style.background=`linear-gradient(to bottom,transparent,${nc.r},transparent)`; nr.style.boxShadow=`0 0 20px ${nc.r},0 0 50px ${nc.r}55` }
  }

  // Tiempo restante
  const timeEl = document.getElementById('trHudTimeVal')
  if (timeEl) {
    const totalSecs = ts.program ? ts.program.duration * 60 : 0
    timeEl.textContent = formatTime(Math.max(0, totalSecs - ts.totalElapsed))
  }

  // RUTINA COMPLETA — una barra por bloque del programa, todo visible
  renderFullRoutineBars()

  // Cadencia objetivo
  const cadEl = document.getElementById('trCadTarget')
  if (cadEl && block) cadEl.textContent = `${block.cadMin}–${block.cadMax} RPM`

  // Próximo cambio
  const blEl = document.getElementById('trBlockTime')
  if (blEl && block) blEl.textContent = formatTime(Math.max(0, block.duration - ts.blockElapsed))

  // Pausa
  const pauseEl = document.getElementById('trPauseIndicator')
  if (pauseEl) pauseEl.style.opacity = ts.pedalingNow ? '0' : '1'

  // Título programa
  const titleEl = document.getElementById('trProgramTitle')
  if (titleEl && ts.program) titleEl.textContent = ts.program.name

  // Progreso barra
  const progEl = document.getElementById('trProgressFill')
  if (progEl && ts.program) {
    const pct = (ts.totalElapsed / (ts.program.duration * 60)) * 100
    progEl.style.width = Math.min(100, pct) + '%'
  }

  // Mensaje entrenador feedback float
  const floatEl = document.getElementById('trainerFloatText')
  if (floatEl && block) {
    if (!ts.pedalingNow) {
      floatEl.textContent = '⏸ ¡Pedalea para avanzar!'
      floatEl.style.color = 'rgba(255,255,255,.5)'
    } else if (rpm < block.cadMin - 3) {
      floatEl.textContent = `↑ Subí a ${block.cadMin}–${block.cadMax} RPM`
      floatEl.style.color = '#f97316'
    } else if (rpm > block.cadMax + 3) {
      floatEl.textContent = `↓ Bajá a ${block.cadMin}–${block.cadMax} RPM`
      floatEl.style.color = '#facc15'
    } else {
      floatEl.textContent = `✓ ¡Perfecto! ${block.cadMin}–${block.cadMax} RPM`
      floatEl.style.color = '#39ff14'
    }
  }
}

// ══════════════════════════════════════
// API
// ══════════════════════════════════════
window.startTrainer      = startTrainer
window.stopTrainer       = stopTrainer
window.trainerPedal      = recordPedal
window.TRAINER_PROGRAMS  = PROGRAMS

console.log("[TRAINER] v2 listo —", PROGRAMS.length, "programas")
