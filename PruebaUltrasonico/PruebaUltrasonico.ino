#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiManager.h>

// Configuración de MQTT
const char* mqtt_server = "192.168.1.50"; 
const int mqtt_port = 1883;
const char* mqtt_topic = "ciudad/tachos/tacho_plaza_1";

// Configuración del Sensor HC-SR04
const int trigPin = 5;
const int echoPin = 18;
const float VELOCIDAD_SONIDO = 0.034;

WiFiClient espClient;
PubSubClient client(espClient);

void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT...");
    if (client.connect("ESP32_Tacho1")) {
      Serial.println("Conectado al Broker!");
    } else {
      Serial.print("Falló, rc=");
      Serial.print(client.state());
      Serial.println(" intentando de nuevo en 5 segundos");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  
  WiFiManager wm;
  bool resultado = wm.autoConnect("TachoInteligente_AP");
  
  if(!resultado) {
    Serial.println("Fallo en la conexión o tiempo de espera agotado");
    ESP.restart();
  } 
  
  Serial.println("¡Conectado exitosamente a la red Wi-Fi!");
  
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duracion = pulseIn(echoPin, HIGH);
  float distancia_cm = (duracion * VELOCIDAD_SONIDO) / 2;
  
  String payload = String(distancia_cm);
  client.publish(mqtt_topic, payload.c_str());
  
  Serial.print("Distancia cruda enviada al server: ");
  Serial.print(distancia_cm);
  Serial.println(" cm");

  delay(5000);
}
