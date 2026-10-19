// ===== GAME.JS - V19 =====
console.log("[GAME] Cargando V19...")

function isOnlineHost() {
  return window.isGameHost?.()
}

const gameState = {
  isConnected: false,
  connectionMethod: null,
  serialPort: null,
  writer: null,

  gameActive: false,
  gameMode: null,
  gameTimer: null,
  timeLeft: 60,
  raceDistance: 1000,

  player1: { velocidad: 0, distancia: 0, clickCount: 0, position: 0 },
  player2: { velocidad: 0, distancia: 0, clickCount: 0, position: 0 },

  totalClicks: 0,
  lastInputTime: 0,
}

// ===== UTILIDADES =====
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden")
    page.classList.remove("active")
  })
  const target = document.getElementById(pageId)
  if (target) {
    target.classList.remove("hidden")
    target.classList.add("active")
  }
}

function updateConnectionStatus(message, connected = false) {
  const el = document.getElementById("estadoConexion")
  if (el) {
    el.innerHTML = `<span class="${connected ? "text-green-800" : "text-blue-800"}">${message}</span>`
    el.className = `mb-4 p-4 rounded-lg border ${connected ? "bg-green-100 border-green-300" : "bg-blue-100 border-blue-300"}`
  }
}

// ===== SENSOR USB =====
async function checkSerialSupport() {
  if (!("serial" in navigator)) {
    updateConnectionStatus("Web Serial no disponible. Usa Chrome/Edge o modo manual.")
    return false
  }
  updateConnectionStatus("Web Serial disponible. Conecta tu sensor.")
  return true
}

async function connectSensor() {
  const supported = await checkSerialSupport()
  if (!supported) {
    gameState.connectionMethod = "manual"
    gameState.isConnected = true
    updateConnectionStatus("Modo manual activado", true)
    return
  }
  try {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: 115200 })
    gameState.serialPort = port
    gameState.isConnected = true
    gameState.connectionMethod = "usb"
    updateConnectionStatus("Sensor conectado!", true)
    document.getElementById("sensorStatus")?.classList.remove("hidden")
    document.getElementById("detectarNodeMCU").textContent = "Sensor Conectado"
    document.getElementById("detectarNodeMCU").disabled = true
    startReading(port)
  } catch (error) {
    console.error("[GAME] Error sensor:", error)
    if (error.name !== "NotFoundError") {
      gameState.connectionMethod = "manual"
      gameState.isConnected = true
      updateConnectionStatus("Modo manual activado", true)
    }
  }
}

function startReading(port) {
  let buffer = ""
  const readLoop = async () => {
    try {
      if (!port.readable) return
      const reader = port.readable.getReader()
      const decoder = new TextDecoder()
      try {
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 100)),
        ])
        if (!done && value) {
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split(/[\r\n]+/)
          buffer = lines.pop() || ""
          for (const line of lines) {
            const clean = line.trim().toLowerCase()
            if (clean === "click" || clean === "sensor_activated" || clean === "1") {
              handleSensorClick()
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (e) {
      if (e.message !== "timeout") console.error("[GAME] Read error:", e)
    }
  }
  setInterval(readLoop, 200)
}

function handleSensorClick() {
  gameState.totalClicks++
  updateClickDisplay()
  const led = document.getElementById("ledDot")
  if (led) {
    led.classList.add("on")
    setTimeout(() => (led.classList.remove("on")), 300)
  }
  const menuLed = document.getElementById("menuLedDot")
  if (menuLed) {
    menuLed.classList.add("on")
    setTimeout(() => menuLed.classList.remove("on"), 300)
  }
  // Modo entrenador
  if (window._trainerActive && typeof window.trainerPedal === 'function') {
    window.trainerPedal()
  }
  // Modo carrera normal
  if (gameState.gameActive) handlePlayerInput(1)
}

// WiFi sensor click — same behavior as USB
window.handleWifiClick = function() {
  handleSensorClick()
}

// Hook sensor into trainer mode — called from handleSensorClick
window._hookTrainerPedal = function() {
  if (typeof window.trainerPedal === 'function' && window._trainerActive) {
    window.trainerPedal()
  }
}

function updateClickDisplay() {
  const el = document.getElementById("totalClicks")
  if (el) el.textContent = gameState.totalClicks
  document.getElementById("clickCounter")?.classList.remove("hidden")
}

// ===== LOGICA DEL JUEGO =====
function handlePlayerInput(playerNum) {
  if (!gameState.gameActive) return

  const isHost = isOnlineHost()
  const player =
    gameState.gameMode === "online"
      ? isHost ? gameState.player1 : gameState.player2
      : playerNum === 1 ? gameState.player1 : gameState.player2

  const now = Date.now()
  const timeDiff = now - gameState.lastInputTime

  if (timeDiff < 200) player.velocidad = 45
  else if (timeDiff < 500) player.velocidad = 35
  else if (timeDiff < 1000) player.velocidad = 25
  else player.velocidad = 15

  const increment = 3 + player.velocidad / 8
  player.distancia = Math.min(gameState.raceDistance, player.distancia + increment)
  player.position = (player.distancia / gameState.raceDistance) * 100
  player.clickCount++

  gameState.lastInputTime = now

  const bikeNum = gameState.gameMode === "online" ? (isHost ? 1 : 2) : playerNum
  const bike = document.getElementById(`bike${bikeNum}`)
  if (bike) {
    const wrap = bike.parentElement.parentElement
    wrap.classList.add("bike-racing")
    setTimeout(() => wrap.classList.remove("bike-racing"), 300)
  }

  // Restart trail animation on each pedal
  const trail = document.getElementById(`trail${bikeNum}`)
  if (trail) {
    trail.querySelectorAll('.trail-line').forEach(line => {
      line.style.animation = 'none'
      line.offsetHeight // reflow
      line.style.animation = ''
    })
  }

  if (typeof window.sendOnlineState === "function" && window.isOnlineGameReady?.()) {
    window.sendOnlineState(player.velocidad, player.distancia, player.clickCount)
  }

  if (typeof window.setScenerySpeed === "function") {
    window.setScenerySpeed(player.velocidad)
  }

  updateDisplay()

  if (player.distancia >= gameState.raceDistance) {
    endGame(gameState.gameMode === "online" ? (isHost ? 1 : 2) : playerNum)
  }
}

// Recibir estado del enemigo online
window.updateEnemyDisplay = (es) => {
  // FIX: aceptar clicks incluso si el juego aun no está activo (para acumular estado)
  if (gameState.gameMode !== "online") return

  const isHost = isOnlineHost()
  const enemyPlayer = isHost ? gameState.player2 : gameState.player1

  enemyPlayer.distancia = es.distance || 0
  enemyPlayer.velocidad = es.speed || 0
  enemyPlayer.clickCount = es.clicks || 0

  enemyPlayer.position = (enemyPlayer.distancia / gameState.raceDistance) * 100

  if (gameState.gameActive) {
    updateDisplay()
    if (enemyPlayer.distancia >= gameState.raceDistance) {
      endGame(isHost ? 2 : 1)
    }
  }
}

function updateDisplay() {
  const p1 = gameState.player1
  const p2 = gameState.player2

  const p1Container = document.getElementById("player1Container")
  const p2Container = document.getElementById("player2Container")

  if (p1Container) p1Container.style.bottom = `${5 + p1.position * 0.85}%`
  if (p2Container) p2Container.style.bottom = `${5 + p2.position * 0.85}%`

  document.getElementById("p1Speed").textContent = `${Math.round(p1.velocidad)} km/h`
  document.getElementById("p1Dist").textContent = `${Math.round(p1.distancia)}m`
  document.getElementById("p2Speed").textContent = `${Math.round(p2.velocidad)} km/h`
  document.getElementById("p2Dist").textContent = `${Math.round(p2.distancia)}m`

  document.getElementById("p1Percent").textContent = `${Math.round(p1.position)}%`
  document.getElementById("p1ProgressFill").style.width = `${p1.position}%`
  document.getElementById("p2Percent").textContent = `${Math.round(p2.position)}%`
  document.getElementById("p2ProgressFill").style.width = `${p2.position}%`
}

// ===== CUENTA REGRESIVA =====
// Se llama desde online.js cuando llega startTime de Firebase.
// Muestra el overlay, luego online.js llama startOnlineRace al momento exacto.
window.showCountdown = (msHastaInicio) => {
  // Primero navegar a la pantalla de carrera
  showPage("juegoCarrera")
  setupOnlineUI()

  // Crear overlay encima de todo
  let overlay = document.getElementById("countdownOverlay")
  if (overlay) overlay.remove()

  overlay = document.createElement("div")
  overlay.id = "countdownOverlay"
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 99999;
    background: rgba(0, 0, 0, 0.82);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: sans-serif;
  `
  document.body.appendChild(overlay)

  const totalSecs = Math.ceil(msHastaInicio / 1000)
  let secsLeft = totalSecs

  function render(n) {
    const isGo = n <= 0
    const color = isGo ? "#4ade80" : n === 1 ? "#f87171" : "#facc15"
    const size = isGo ? "7rem" : "11rem"
    overlay.innerHTML = `
      <div style="text-align:center; color:white; user-select:none;">
        <div style="font-size:1.6rem; margin-bottom:16px; opacity:0.85; letter-spacing:1px;">
          ¡La carrera comienza en...
        </div>
        <div style="
          font-size:${size};
          font-weight:900;
          color:${color};
          text-shadow: 0 0 60px ${color};
          line-height:1;
          transition: all 0.15s ease;
        ">${isGo ? "🚴 ¡YA!" : n}</div>
        <div style="font-size:1rem; opacity:0.5; margin-top:20px;">
          ${isGo ? "¡Pedaleá!" : "Preparate..."}
        </div>
      </div>
    `
  }

  render(secsLeft)

  const interval = setInterval(() => {
    secsLeft--
    render(secsLeft)
    if (secsLeft < 0) {
      clearInterval(interval)
      setTimeout(() => overlay.remove(), 700)
    }
  }, 1000)
}

// Configura la UI de carrera para modo online (carriles, botones, labels)
function setupOnlineUI() {
  const isHost = isOnlineHost()

  document.getElementById("lane2")?.classList.remove("hidden")
  document.getElementById("progressP2")?.classList.remove("hidden")
  document.getElementById("modoDisplay").textContent = "Online"

  const btnP1 = document.getElementById("btnP1Click")
  const btnP2 = document.getElementById("btnP2Click")

  if (isHost) {
    // Host = Jugador 1 (azul)
    btnP1?.classList.remove("hidden")
    btnP2?.classList.add("hidden")
    if (btnP1) btnP1.textContent = "🚴‍♂️ Pedalear (Tú - J1)"
  } else {
    // Guest = Jugador 2 (rojo) — FIX: mostrar botón rojo, ocultar azul
    btnP1?.classList.add("hidden")
    btnP2?.classList.remove("hidden")
    if (btnP2) btnP2.textContent = "🚴 Pedalear (Tú - J2)"
  }
}

// ===== INICIO DE CARRERA ONLINE =====
window.startOnlineRace = (fbStartTime, fbDuration, fbDist, fbNoTime) => {
  console.log("[GAME] startOnlineRace GO dist:", fbDist, "noTime:", fbNoTime)

  gameState.gameActive   = true
  gameState.gameMode     = "online"
  gameState.raceDistance = fbDist || 1000
  gameState.player1 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.player2 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.lastInputTime = Date.now()

  // Update meta display
  const metaEl = document.querySelector('.hud-cell:nth-child(2) .hud-val')
  if (metaEl) metaEl.textContent = (fbDist || 1000) + 'm'

  showPage("juegoCarrera")
  setupOnlineUI()

  const endTime = fbStartTime + fbDuration
  const noTime  = fbNoTime || false

  if (gameState.gameTimer) clearInterval(gameState.gameTimer)

  if (noTime) {
    gameState.timeLeft = 0
    gameState.gameTimer = setInterval(() => {
      if (!gameState.gameActive) return
      gameState.timeLeft++
      document.getElementById("tiempoRestante").textContent = gameState.timeLeft + 's'
    }, 1000)
  } else {
    gameState.gameTimer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      gameState.timeLeft = remaining
      document.getElementById("tiempoRestante").textContent = remaining
      if (remaining <= 0) {
        clearInterval(gameState.gameTimer)
        endGame(null)
      }
    }, 250)
  }

  setInterval(() => {
    if (gameState.gameActive) {
      gameState.player1.velocidad *= 0.95
      gameState.player2.velocidad *= 0.95
      updateDisplay()
    }
  }, 500)
}

// ===== INICIO CON CONFIG =====
window.startGameWithConfig = function(cfg) {
  const mode     = cfg.mode     || 'single'
  const timeSecs = cfg.noTime   ? 999999 : (cfg.time || 60)
  const dist     = cfg.dist     || 1000
  const noTime   = cfg.noTime   || false

  console.log('[GAME] Config:', mode, timeSecs + 's', dist + 'm', noTime ? 'SIN TIEMPO' : '')

  gameState.gameActive  = true
  gameState.gameMode    = mode
  gameState.timeLeft    = timeSecs
  gameState.raceDistance = dist
  gameState.player1 = { velocidad:0, distancia:0, clickCount:0, position:0 }
  gameState.player2 = { velocidad:0, distancia:0, clickCount:0, position:0 }
  gameState.lastInputTime = Date.now()

  // HUD meta
  const metaEl = document.querySelector('.hud-cell:nth-child(2) .hud-val')
  if (metaEl) metaEl.textContent = dist + 'm'

  // UI segun modo
  const lane2      = document.getElementById('lane2')
  const progressP2 = document.getElementById('progressP2')
  const btnP1      = document.getElementById('btnP1Click')
  const btnP2      = document.getElementById('btnP2Click')
  const modoDisplay = document.getElementById('modoDisplay')

  if (mode === 'multi') {
    lane2?.classList.remove('hidden')
    progressP2?.classList.remove('hidden')
    btnP1?.classList.remove('hidden')
    btnP2?.classList.remove('hidden')
    if (modoDisplay) modoDisplay.textContent = '2P'
  } else {
    lane2?.classList.add('hidden')
    progressP2?.classList.add('hidden')
    btnP1?.classList.remove('hidden')
    btnP2?.classList.add('hidden')
    if (modoDisplay) modoDisplay.textContent = 'IND'
  }

  // Timer
  if (gameState.gameTimer) clearInterval(gameState.gameTimer)

  if (noTime) {
    // Sin tiempo: mostrar tiempo corriendo hacia arriba
    gameState.timeLeft = 0
    gameState.gameTimer = setInterval(() => {
      if (!gameState.gameActive) return
      gameState.timeLeft++
      document.getElementById('tiempoRestante').textContent = gameState.timeLeft + 's'
    }, 1000)
  } else {
    document.getElementById('tiempoRestante').textContent = timeSecs
    gameState.gameTimer = setInterval(() => {
      gameState.timeLeft--
      document.getElementById('tiempoRestante').textContent = gameState.timeLeft
      if (gameState.timeLeft <= 0) {
        clearInterval(gameState.gameTimer)
        endGame(null)
      }
    }, 1000)
  }

  // Velocity decay
  setInterval(() => {
    if (gameState.gameActive) {
      gameState.player1.velocidad *= 0.95
      gameState.player2.velocidad *= 0.95
      updateDisplay()
    }
  }, 500)
}

// ===== INICIO LOCAL =====
function startGame(mode) {
  console.log("[GAME] Iniciando modo:", mode)

  gameState.gameActive = true
  gameState.gameMode = mode
  gameState.timeLeft = 60
  gameState.player1 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.player2 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.lastInputTime = Date.now()

  showPage("juegoCarrera")

  const lane2 = document.getElementById("lane2")
  const progressP2 = document.getElementById("progressP2")
  const btnP1 = document.getElementById("btnP1Click")
  const btnP2 = document.getElementById("btnP2Click")

  if (mode === "multi") {
    lane2?.classList.remove("hidden")
    progressP2?.classList.remove("hidden")
    btnP1?.classList.remove("hidden")
    btnP2?.classList.remove("hidden")
    if (btnP1) btnP1.textContent = "🚴‍♂️ Jugador 1 (Click/Sensor)"
    if (btnP2) btnP2.textContent = "🚴 Jugador 2 (Espacio)"
    document.getElementById("modoDisplay").textContent = "Multijugador"
  } else {
    lane2?.classList.add("hidden")
    progressP2?.classList.add("hidden")
    btnP1?.classList.remove("hidden")
    btnP2?.classList.add("hidden")
    if (btnP1) btnP1.textContent = "🚴‍♂️ Jugador 1 (Click/Sensor)"
    document.getElementById("modoDisplay").textContent = "Individual"
  }

  if (gameState.gameTimer) clearInterval(gameState.gameTimer)

  gameState.gameTimer = setInterval(() => {
    gameState.timeLeft--
    document.getElementById("tiempoRestante").textContent = gameState.timeLeft
    if (gameState.timeLeft <= 0) {
      clearInterval(gameState.gameTimer)
      endGame(null)
    }
  }, 1000)

  setInterval(() => {
    if (gameState.gameActive) {
      gameState.player1.velocidad *= 0.95
      gameState.player2.velocidad *= 0.95
      updateDisplay()
    }
  }, 500)
}

function endGame(winner) {
  gameState.gameActive = false
  if (gameState.gameTimer) clearInterval(gameState.gameTimer)
  // Limpiar overlay de countdown por si quedó
  document.getElementById("countdownOverlay")?.remove()
  setTimeout(() => {
    showPage("resultados")
    showResults(winner)
  }, 500)
}

window.endGame = endGame

function showResults(winner) {
  const p1 = gameState.player1
  const p2 = gameState.player2
  const byTime = winner === null  // ended by timer

  let winnerText = ""
  let subText = ""

  if (winner === 1) {
    winnerText = "¡JUGADOR 1 GANÓ!"
  } else if (winner === 2) {
    winnerText = "¡JUGADOR 2 GANÓ!"
  } else if (p1.distancia > p2.distancia) {
    winnerText = "¡JUGADOR 1 GANÓ!"
    if (byTime) subText = "POR DISTANCIA — TIEMPO AGOTADO"
  } else if (p2.distancia > p1.distancia) {
    winnerText = "¡JUGADOR 2 GANÓ!"
    if (byTime) subText = "POR DISTANCIA — TIEMPO AGOTADO"
  } else {
    winnerText = "¡EMPATE!"
    if (byTime) subText = "TIEMPO AGOTADO"
  }

  document.getElementById("winnerText").textContent = winnerText
  // Show subtext if present
  let subEl = document.getElementById("winnerSubText")
  if (!subEl) {
    subEl = document.createElement("div")
    subEl.id = "winnerSubText"
    subEl.style.cssText = "font-family:'Orbitron',monospace;font-size:.55rem;letter-spacing:3px;color:#3a4570;margin-top:6px;"
    document.getElementById("winnerText").after(subEl)
  }
  subEl.textContent = subText

  document.getElementById("winnerText").textContent = winnerText

  document.getElementById("resultsTable").innerHTML = `
    <div class="result-card" style="border-right:1px solid var(--border);">
      <div class="arcade-title neon-cyan" style="font-size:.7rem; margin-bottom:8px;">JUGADOR 1</div>
      <div class="result-dist neon-cyan">${Math.round(p1.distancia)}m</div>
      <div class="result-clicks">${p1.clickCount} PEDALADAS</div>
    </div>
    <div class="result-card">
      <div class="arcade-title neon-orange" style="font-size:.7rem; margin-bottom:8px;">JUGADOR 2</div>
      <div class="result-dist neon-orange">${Math.round(p2.distancia)}m</div>
      <div class="result-clicks">${p2.clickCount} PEDALADAS</div>
    </div>
  `
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM ready")
  checkSerialSupport()

  document.getElementById("detectarNodeMCU")?.addEventListener("click", connectSensor)

  document.getElementById("btnLocal")?.addEventListener("click", () => showPage("seleccionModo"))
  document.getElementById("btnOnline")?.addEventListener("click", () => showPage("paginaOnline"))
  document.getElementById("volverInicio")?.addEventListener("click", () => showPage("inicio"))
  document.getElementById("volverDesdeOnline")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    document.getElementById("opcionesView")?.classList.remove("hidden")
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("conectadoView")?.classList.add("hidden")
    document.getElementById("configOnline")?.classList.add("hidden")
    const btnCrear = document.getElementById("btnCrearSala")
    if (btnCrear) { btnCrear.style.borderRadius = ""; btnCrear.style.borderBottom = ""; }
    showPage("inicio")
  })

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      startGame(this.dataset.mode)
    })
  })

  // btnCrearSala is now handled in index.html (shows config panel first)

  document.getElementById("btnUnirseSala")?.addEventListener("click", () => {
    document.getElementById("opcionesView")?.classList.add("hidden")
    document.getElementById("unirseSalaView")?.classList.remove("hidden")
  })

  async function intentarUnirse() {
    const input = document.getElementById("inputCodigoSala")
    const codigo = input?.value.toUpperCase()
    if (!codigo || codigo.length < 4) {
      alert("Ingresa un código de 4 caracteres")
      return
    }
    const btn = document.getElementById("btnConectarSala")
    btn.textContent = "BUSCANDO..."
    btn.disabled = true

    if (typeof window.joinRoom === "function") {
      const ok = await window.joinRoom(codigo)
      if (ok) {
        document.getElementById("salaConectada").textContent = codigo
        document.getElementById("unirseSalaView")?.classList.add("hidden")
        document.getElementById("conectadoView")?.classList.remove("hidden")
      }
    }
    btn.textContent = "UNIRSE A LA SALA"
    btn.disabled = false
  }

  document.getElementById("btnConectarSala")?.addEventListener("click", intentarUnirse)

  // ENTER en el input del código
  document.getElementById("inputCodigoSala")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); intentarUnirse() }
  })

  // Limpiar input al cancelar unirse
  document.getElementById("btnCancelarUnirse")?.addEventListener("click", () => {
    const input = document.getElementById("inputCodigoSala")
    if (input) input.value = ""
  })

  // btnIniciarOnline removed — race starts automatically via Firebase

  document.getElementById("btnSimularConexion")?.addEventListener("click", () => {
    const codigo = document.getElementById("codigoSala").textContent
    document.getElementById("salaConectada").textContent = codigo
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("conectadoView")?.classList.remove("hidden")
    document.getElementById("p1StatusOnline").textContent = "Tu (Host)"
    document.getElementById("p2StatusOnline").textContent = "Conectado"
  })

  document.getElementById("btnCancelarCrear")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("configOnline")?.classList.add("hidden")
    document.getElementById("opcionesView")?.classList.remove("hidden")
    // Reset crear sala button style
    const btnCrear = document.getElementById("btnCrearSala")
    if (btnCrear) { btnCrear.style.borderRadius = ""; btnCrear.style.borderBottom = ""; }
  })

  // btnCancelarUnirse extended above (also clears input)
  document.getElementById("btnCancelarUnirse")?.addEventListener("click", () => {
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("opcionesView")?.classList.remove("hidden")
  })

  // Botón azul → siempre jugador 1 (host en online, j1 en local)
  document.getElementById("btnP1Click")?.addEventListener("click", () => {
    if (gameState.gameActive) handlePlayerInput(1)
  })

  // Botón rojo → jugador 2 (guest en online, j2 en local)
  document.getElementById("btnP2Click")?.addEventListener("click", () => {
    if (!gameState.gameActive) return
    if (gameState.gameMode === "multi") handlePlayerInput(2)
    if (gameState.gameMode === "online" && !isOnlineHost()) handlePlayerInput(2)
  })

  document.addEventListener("keydown", (e) => {
    if (!gameState.gameActive) return
    if (e.code === "Space") {
      e.preventDefault()
      if (gameState.gameMode === "multi") handlePlayerInput(2)
      if (gameState.gameMode === "online") {
        handlePlayerInput(isOnlineHost() ? 1 : 2)
      }
    }
  })

  document.getElementById("btnPlayAgain")?.addEventListener("click", () => {
    if (gameState.gameMode === "online") {
      window.cleanupOnlineGame?.()
      // Reset all online views
      document.getElementById("opcionesView")?.classList.remove("hidden")
      document.getElementById("crearSalaView")?.classList.add("hidden")
      document.getElementById("unirseSalaView")?.classList.add("hidden")
      document.getElementById("conectadoView")?.classList.add("hidden")
      document.getElementById("configOnline")?.classList.add("hidden")
      const inputCodigo = document.getElementById("inputCodigoSala")
      if (inputCodigo) inputCodigo.value = ""
      const btnCrear = document.getElementById("btnCrearSala")
      if (btnCrear) { btnCrear.style.borderRadius = ""; btnCrear.style.borderBottom = ""; }
      showPage("paginaOnline")
    } else {
      showPage("seleccionModo")
    }
  })

  document.getElementById("btnBackHome")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    showPage("inicio")
  })
})

console.log("[GAME] V19 cargado!")
