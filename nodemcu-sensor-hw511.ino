// =====================================================
// BIKE RACE GAME — NodeMCU Firmware v3.1
// Sensor HW-511 → WiFi → Firebase Realtime Database
// =====================================================
//
// LIBRERÍAS NECESARIAS (Arduino IDE → Gestionar Librerías):
//   1. WiFiManager    by tzapu       → buscar "WiFiManager"
//   2. FirebaseESP8266 by Mobizt     → buscar "FirebaseESP8266"
//
// PLACA: NodeMCU 1.0 (ESP-12E Module)
// =====================================================

#include <ESP8266WiFi.h>
#include <WiFiManager.h>
#include <FirebaseESP8266.h>

// =====================================================
// ⚙️  CONFIGURACIÓN — CAMBIAR POR CADA DISPOSITIVO
// =====================================================
#define DEVICE_ID     "bike_001"
#define FIREBASE_HOST "bicigame-a06d7-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "TU_DATABASE_SECRET_AQUI"
// =====================================================

// ── PINES ──
const int SENSOR_PIN = D2;
const int LED_PIN    = LED_BUILTIN;
const int RESET_PIN  = D3;

// ── FIREBASE ──
FirebaseData   fbData;
FirebaseConfig fbConfig;
FirebaseAuth   fbAuth;

// ── ESTADO ──
bool          lastSensorState = HIGH;
unsigned long lastClickTime   = 0;
unsigned long lastHeartbeat   = 0;
const unsigned long DEBOUNCE_MS  = 200;
const unsigned long HEARTBEAT_MS = 10000;
bool firebaseReady = false;

// =====================================================
// SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== BIKE RACE NodeMCU v3.1 ===");
  Serial.print("Device ID: ");
  Serial.println(DEVICE_ID);

  pinMode(SENSOR_PIN, INPUT_PULLUP);
  pinMode(LED_PIN,    OUTPUT);
  pinMode(RESET_PIN,  INPUT_PULLUP);
  digitalWrite(LED_PIN, HIGH);

  // Reset WiFi si D3 presionado al arrancar
  delay(100);
  if (digitalRead(RESET_PIN) == LOW) {
    Serial.println("[WIFI] Borrando credenciales...");
    blinkLed(5, 100);
    WiFiManager wm;
    wm.resetSettings();
    delay(500);
    ESP.restart();
  }

  // WiFiManager
  Serial.println("[WIFI] Conectando...");
  WiFiManager wm;
  wm.setConfigPortalTimeout(180);

  bool connected = wm.autoConnect("BikeGame-Setup", "bikerace123");
  if (!connected) {
    Serial.println("[WIFI] Timeout — reiniciando...");
    ESP.restart();
  }

  Serial.print("[WIFI] Conectado! IP: ");
  Serial.println(WiFi.localIP());
  blinkLed(3, 150);

  // Firebase
  Serial.println("[FIREBASE] Conectando...");
  fbConfig.host                  = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);

  String base = "/sensors/" + String(DEVICE_ID);

  if (Firebase.setString(fbData, base + "/status",   "online") &&
      Firebase.setString(fbData, base + "/deviceId", DEVICE_ID) &&
      Firebase.setString(fbData, base + "/ip",       WiFi.localIP().toString())) {
    firebaseReady = true;
    Firebase.setInt(fbData, base + "/lastClick", 0);
    Serial.println("[FIREBASE] Conectado!");
  } else {
    Serial.print("[FIREBASE] Error: ");
    Serial.println(fbData.errorReason());
  }

  Serial.println("=== Listo para pedalear! ===");
  Serial.print("ws://");
  Serial.print(WiFi.localIP());
  Serial.println(" (Firebase)");
  blinkLed(3, 100);
}

// =====================================================
// LOOP
// =====================================================
void loop() {
  bool currentState = digitalRead(SENSOR_PIN);

  if (currentState == LOW && lastSensorState == HIGH) {
    unsigned long now = millis();
    if (now - lastClickTime > DEBOUNCE_MS) {
      lastClickTime = now;
      onSensorClick();
    }
  }
  lastSensorState = currentState;

  if (millis() - lastHeartbeat > HEARTBEAT_MS) {
    lastHeartbeat = millis();
    sendHeartbeat();
  }
}

// =====================================================
// CLICK → FIREBASE
// =====================================================
void onSensorClick() {
  Serial.println("[SENSOR] Click!");
  Serial.println("click");

  digitalWrite(LED_PIN, LOW);
  delay(30);
  digitalWrite(LED_PIN, HIGH);

  if (!firebaseReady) return;

  String base = "/sensors/" + String(DEVICE_ID);
  int ts = (int)(millis() / 1000);

  if (Firebase.setInt(fbData, base + "/lastClick", ts)) {
    Serial.println("[FIREBASE] Click enviado OK");
  } else {
    Serial.print("[FIREBASE] Error click: ");
    Serial.println(fbData.errorReason());
  }
}

// =====================================================
// HEARTBEAT
// =====================================================
void sendHeartbeat() {
  if (!firebaseReady) return;
  String base = "/sensors/" + String(DEVICE_ID);
  Firebase.setString(fbData, base + "/status",   "online");
  Firebase.setInt   (fbData, base + "/lastSeen", (int)(millis() / 1000));
  Firebase.setInt   (fbData, base + "/rssi",     WiFi.RSSI());
  Serial.printf("[HB] online RSSI:%d\n", WiFi.RSSI());
}

// =====================================================
// UTILS
// =====================================================
void blinkLed(int times, int ms) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);  delay(ms);
    digitalWrite(LED_PIN, HIGH); delay(ms);
  }
}
