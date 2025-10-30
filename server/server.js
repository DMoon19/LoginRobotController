// server.js - Servidor intermediario para comandos del robot
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Permitir solicitudes desde cualquier origen
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estado actual del comando (lo que el ESP32 leerá)
let currentCommand = {
  action: 'stop',
  leftSpeed: 255,
  rightSpeed: 255,
  timestamp: new Date().toISOString()
};

// Historial de comandos
let commandHistory = [];
const MAX_HISTORY = 50;

// Telemetría del robot
let telemetryData = [];
const MAX_TELEMETRY = 100;

// ===== RUTAS PARA LA WEB APP =====

// POST /entities - Recibir comandos desde la aplicación web
app.post('/entities', (req, res) => {
  const { action, leftSpeed, rightSpeed } = req.body;
  
  if (!action) {
    return res.status(400).json({ error: 'Se requiere el campo action' });
  }

  // Actualizar comando actual
  currentCommand = {
    action: action,
    leftSpeed: leftSpeed || 255,
    rightSpeed: rightSpeed || 255,
    timestamp: new Date().toISOString()
  };

  // Guardar en historial
  commandHistory.unshift({ ...currentCommand });
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory.pop();
  }

  console.log(`[WEB] Comando recibido: ${action} (L:${currentCommand.leftSpeed}, R:${currentCommand.rightSpeed})`);

  res.json({
    state: action.toUpperCase(),
    message: 'Comando recibido',
    command: currentCommand
  });
});

// ===== RUTAS PARA EL ESP32 =====

// GET /entities - ESP32 lee el comando actual
app.get('/entities', (req, res) => {
  console.log(`[ESP32] Comando leído: ${currentCommand.action}`);
  res.json(currentCommand);
});

// POST /telemetry - ESP32 envía telemetría (GPS, temperatura, humedad)
app.post('/telemetry', (req, res) => {
  const { latitude, longitude, temperature, humidity, counter } = req.body;
  
  const telemetry = {
    latitude,
    longitude,
    temperature,
    humidity,
    counter,
    timestamp: new Date().toISOString()
  };

  telemetryData.unshift(telemetry);
  if (telemetryData.length > MAX_TELEMETRY) {
    telemetryData.pop();
  }

  console.log(`[ESP32] Telemetría: GPS(${latitude}, ${longitude}) T:${temperature}°C H:${humidity}%`);

  res.json({
    message: 'Telemetría recibida',
    saved: true
  });
});

// ===== RUTAS DE CONSULTA =====

// GET /history - Ver historial de comandos
app.get('/history', (req, res) => {
  res.json({
    total: commandHistory.length,
    commands: commandHistory
  });
});

// GET /telemetry - Ver telemetría reciente
app.get('/telemetry', (req, res) => {
  res.json({
    total: telemetryData.length,
    data: telemetryData
  });
});

// GET /status - Estado actual del sistema
app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    currentCommand: currentCommand,
    latestTelemetry: telemetryData[0] || null,
    commandHistoryCount: commandHistory.length,
    telemetryCount: telemetryData.length
  });
});

// Ruta raíz - Dashboard simple
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Robot Tank Server</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .command { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .telemetry { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 10px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .endpoint { margin: 10px 0; padding: 10px; background: #fafafa; border-left: 3px solid #2196F3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Robot Tank Control Server</h1>
        <div class="status">
          <h2>Estado del Servidor</h2>
          <p><strong>Estado:</strong> ✅ Online</p>
          <p><strong>Puerto:</strong> ${PORT}</p>
          <p><strong>Comandos en historial:</strong> ${commandHistory.length}</p>
          <p><strong>Datos de telemetría:</strong> ${telemetryData.length}</p>
        </div>

        <div class="command">
          <h2>Último Comando</h2>
          <pre>${JSON.stringify(currentCommand, null, 2)}</pre>
        </div>

        ${telemetryData.length > 0 ? `
        <div class="telemetry">
          <h2>Última Telemetría</h2>
          <pre>${JSON.stringify(telemetryData[0], null, 2)}</pre>
        </div>
        ` : ''}

        <h2>📡 Endpoints Disponibles</h2>
        
        <div class="endpoint">
          <strong>POST /entities</strong> - Enviar comando desde la web app
          <pre>{ "action": "forward", "leftSpeed": 255, "rightSpeed": 255 }</pre>
        </div>

        <div class="endpoint">
          <strong>GET /entities</strong> - ESP32 lee el comando actual
        </div>

        <div class="endpoint">
          <strong>POST /telemetry</strong> - ESP32 envía telemetría
          <pre>{ "latitude": 6.2442, "longitude": -75.5812, "temperature": 25.5, "humidity": 60, "counter": 123 }</pre>
        </div>

        <div class="endpoint">
          <strong>GET /status</strong> - Ver estado completo del sistema
        </div>

        <div class="endpoint">
          <strong>GET /history</strong> - Ver historial de comandos
        </div>

        <div class="endpoint">
          <strong>GET /telemetry</strong> - Ver telemetría reciente
        </div>

        <h3>🔄 Auto-refresh en 5 segundos...</h3>
        <script>setTimeout(() => location.reload(), 5000);</script>
      </div>
    </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor de comandos iniciado`);
  console.log(`📡 Escuchando en el puerto ${PORT}`);
  console.log(`🌐 Accede desde: http://localhost:${PORT}`);
  console.log(`\n📋 Endpoints disponibles:`);
  console.log(`   POST /entities     - Recibir comandos desde web`);
  console.log(`   GET  /entities     - ESP32 lee comandos`);
  console.log(`   POST /telemetry    - ESP32 envía telemetría`);
  console.log(`   GET  /status       - Estado del sistema`);
  console.log(`   GET  /history      - Historial de comandos`);
  console.log(`   GET  /telemetry    - Datos de telemetría\n`);
});