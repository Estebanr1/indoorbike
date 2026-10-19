// ===== ONLINE.JS – V18 =====
console.log("[ONLINE] Cargando modulo online V18")

if (!firebase.apps.length) {
  firebase.initializeApp({
    databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
  })
}
const db = firebase.database()

let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let raceStarted = false

let enemyState = { speed: 0, distance: 0, clicks: 0 }
let startTime = null
let duration = 30000

console.log("[ONLINE] Player ID:", playerId)

async function createRoom() {
  try {
    isHost = true
    onlineReady = false
    raceStarted = false
    roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

    // Use config from UI if available
    const cfg = window.onlineRaceConfig || {}
    const roomDuration = cfg.duration || duration
    const roomDist     = cfg.dist     || 1000
    const roomNoTime   = cfg.noTime   || false

    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      gameStarted: false,
      startTime: null,
      duration: roomDuration,
      dist: roomDist,
      noTime: roomNoTime,
      players: {
        [playerId]: { speed: 0, distance: 0, clicks: 0 },
      },
    })

    const codeEl = document.getElementById("codigoSala")
    if (codeEl) codeEl.textContent = roomId

    listenRoom()
  } catch (err) {
    console.error("[ONLINE] Error creando sala:", err)
    alert("Error creando sala")
  }
}

async function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false
  onlineReady = false
  raceStarted = false

  try {
    const ref = db.ref(`rooms/${roomId}`)
    const snap = await ref.once("value")

    if (!snap.exists()) {
      alert("Sala no existe. Revisá el código e intentá de nuevo.")
      roomId = null
      return false
    }

    const room = snap.val()
    const players = room.players || {}

    if (Object.keys(players).length >= 2) {
      alert("La sala ya está llena.")
      roomId = null
      return false
    }

    await db.ref(`rooms/${roomId}/players/${playerId}`).set({
      speed: 0,
      distance: 0,
      clicks: 0,
    })

    console.log("[ONLINE] Unido a sala:", roomId)
    listenRoom()
    return true

  } catch (err) {
    console.error("[ONLINE] Error al unirse:", err)
    alert("Error de conexión. Revisá tu internet e intentá de nuevo.")
    roomId = null
    return false
  }
}

function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    const ids = Object.keys(players)

    onlineReady = ids.length === 2

    // HOST: cuando llegan 2 jugadores, escribe startTime con 3s de margen
    if (onlineReady && isHost && !room.gameStarted) {
      const now = Date.now() + 3000
      db.ref(`rooms/${roomId}`).update({
        gameStarted: true,
        startTime: now,
      })
    }

    // AMBOS: cuando Firebase confirma startTime, mostrar countdown y arrancar
    if (room.gameStarted && room.startTime && !raceStarted) {
      raceStarted = true
      startTime = room.startTime
      duration = room.duration || duration

      const msHastaInicio = startTime - Date.now()

      // Mostrar countdown
      if (typeof window.showCountdown === "function") {
        window.showCountdown(msHastaInicio)
      }

      setTimeout(() => {
        if (typeof window.startOnlineRace === "function") {
          window.startOnlineRace(startTime, duration)
        }
      }, Math.max(0, msHastaInicio))
    }

    // Estado del enemigo (incluye clicks)
    ids.forEach((id) => {
      if (id !== playerId) {
        enemyState = players[id]
        if (typeof window.updateEnemyDisplay === "function") {
          window.updateEnemyDisplay(enemyState)
        }
      }
    })
  })
}

// FIX: ahora también envía clicks
function sendOnlineState(speed, distance, clicks) {
  if (!roomId || !onlineReady) return
  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
    clicks,
    t: Date.now(),
  })
}

function isOnlineGameReady() { return onlineReady }
function isGameHost() { return isHost }
function getRoomId() { return roomId }

function cleanupOnlineGame() {
  if (!roomId) return
  db.ref(`rooms/${roomId}/players/${playerId}`).remove()
  if (isHost) db.ref(`rooms/${roomId}`).remove()
  roomId = null
  onlineReady = false
  isHost = false
  raceStarted = false
  startTime = null
}

window.addEventListener("beforeunload", cleanupOnlineGame)

window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V18 cargado")
