// server.js - Servidor intermediario para comandos del robot
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estado actual del comando (formato para ESP32)
let currentCommand = {
  command: 'STOP',
  speedness: 0
};

// Historial de comandos
let commandHistory = [];
const MAX_HISTORY = 50;

// Telemetría del robot
let telemetryData = [];
const MAX_TELEMETRY = 100;

// ===== FUNCIÓN: Convertir formato React → ESP32 =====
function convertToESP32Format(action, leftSpeed, rightSpeed) {
  // Convertir acción a mayúsculas
  let command = action.toUpperCase();
  
  // Calcular velocidad promedio (0-255 → 0-100)
  let avgSpeed = Math.round((leftSpeed + rightSpeed) / 2);
  let speedness = Math.round((avgSpeed / 255) * 100);
  
  return {
    command: command,
    speedness: speedness
  };
}

// ===== RUTAS PARA LA WEB APP =====

// POST /entities - Recibir comandos desde la aplicación web
app.post('/entities', (req, res) => {
  const { action, leftSpeed, rightSpeed } = req.body;
  
  if (!action) {
    return res.status(400).json({ error: 'Se requiere el campo action' });
  }

  // Convertir formato React → ESP32
  currentCommand = convertToESP32Format(
    action, 
    leftSpeed || 255, 
    rightSpeed || 255
  );

  // Guardar en historial (formato original para referencia)
  commandHistory.unshift({ 
    action,
    leftSpeed: leftSpeed || 255,
    rightSpeed: rightSpeed || 255,
    convertedTo: currentCommand,
    timestamp: new Date().toISOString()
  });
  
  if (commandHistory.length > MAX_HISTORY) {
    commandHistory.pop();
  }

  console.log(`[WEB → SERVER] Recibido: ${action} (L:${leftSpeed || 255}, R:${rightSpeed || 255})`);
  console.log(`[SERVER → ESP32] Convertido: ${currentCommand.command} @ ${currentCommand.speedness}%`);

  res.json({
    state: action.toUpperCase(),
    message: 'Comando recibido y convertido',
    sent: currentCommand
  });
});

// ===== RUTAS PARA EL ESP32 =====

// GET /entities - ESP32 lee el comando actual (formato ESP32)
app.get('/entities', (req, res) => {
  console.log(`[ESP32 ← SERVER] Enviando: ${currentCommand.command} @ ${currentCommand.speedness}%`);
  res.json(currentCommand);
});

// POST /telemetry - ESP32 envía telemetría
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
      <meta http-equiv="refresh" content="2">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .command { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .telemetry { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 10px 0; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
        .endpoint { margin: 10px 0; padding: 10px; background: #fafafa; border-left: 3px solid #2196F3; }
        .flow { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        code { background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Robot Tank Control Server</h1>
        
        <div class="status">
          <h2>📊 Estado del Servidor</h2>
          <p>✅ <strong>Estado:</strong> Online</p>
          <p>🔌 <strong>Puerto:</strong> ${PORT}</p>
          <p>📝 <strong>Comandos en historial:</strong> ${commandHistory.length}</p>
          <p>📡 <strong>Datos de telemetría:</strong> ${telemetryData.length}</p>
          <p>🕐 <strong>Actualizado:</strong> ${new Date().toLocaleTimeString()}</p>
        </div>

        <div class="flow">
          <h2>🔄 Flujo de Datos</h2>
          <p><strong>React App</strong> → <code>POST /entities</code> → <strong>Servidor</strong> → <code>GET /entities</code> → <strong>ESP32</strong> → <strong>Robot LoRa</strong></p>
        </div>

        <div class="command">
          <h2>📤 Comando Actual (ESP32 Format)</h2>
          <pre>${JSON.stringify(currentCommand, null, 2)}</pre>
        </div>

        ${commandHistory.length > 0 ? `
        <div class="command">
          <h2>📜 Último Comando Recibido (React Format)</h2>
          <pre>${JSON.stringify(commandHistory[0], null, 2)}</pre>
        </div>
        ` : ''}

        ${telemetryData.length > 0 ? `
        <div class="telemetry">
          <h2>🌡️ Última Telemetría</h2>
          <pre>${JSON.stringify(telemetryData[0], null, 2)}</pre>
        </div>
        ` : ''}

        <h2>📡 Endpoints API</h2>
        
        <div class="endpoint">
          <strong>POST /entities</strong> - Recibir comando desde React App
          <pre>{ "action": "forward", "leftSpeed": 255, "rightSpeed": 255 }</pre>
          <p><em>Se convierte automáticamente a formato ESP32</em></p>
        </div>

        <div class="endpoint">
          <strong>GET /entities</strong> - ESP32 lee comando actual
          <pre>{ "command": "FORWARD", "speedness": 100 }</pre>
        </div>

        <div class="endpoint">
          <strong>GET /status</strong> - Ver estado completo del sistema
        </div>

        <div class="endpoint">
          <strong>GET /history</strong> - Ver historial de comandos
        </div>

        <h2>🔧 Conversión de Formatos</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background: #e0e0e0;">
            <th style="padding: 8px; border: 1px solid #ccc;">React App</th>
            <th style="padding: 8px; border: 1px solid #ccc;">→</th>
            <th style="padding: 8px; border: 1px solid #ccc;">ESP32</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ccc;"><code>action: "forward"</code></td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">→</td>
            <td style="padding: 8px; border: 1px solid #ccc;"><code>command: "FORWARD"</code></td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="padding: 8px; border: 1px solid #ccc;"><code>leftSpeed: 255, rightSpeed: 255</code></td>
            <td style="padding: 8px; border: 1px solid #ccc; text-align: center;">→</td>
            <td style="padding: 8px; border: 1px solid #ccc;"><code>speedness: 100</code> (promedio en %)</td>
          </tr>
        </table>

        <p style="margin-top: 20px; text-align: center; color: #666; font-size: 14px;">
          🔄 Auto-refresh cada 2 segundos
        </p>
      </div>
    </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Robot Tank Control Server`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 Dashboard: http://54.82.198.234:${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   POST /entities     → Recibir comandos (React)`);
  console.log(`   GET  /entities     → Enviar comandos (ESP32)`);
  console.log(`   GET  /status       → Estado del sistema`);
  console.log(`   GET  /history      → Historial de comandos`);
  console.log(`\n🔄 Conversión automática: React format → ESP32 format`);
  console.log(`${'='.repeat(50)}\n`);
});