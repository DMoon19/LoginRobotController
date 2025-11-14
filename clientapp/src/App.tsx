import React, { useState } from 'react';
import { LogOut, Home, Database, User, Lock, Radio } from 'lucide-react';

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = '1000874956';

interface Telemetria {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  counter: number;
  timestamp: string;
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSection, setCurrentSection] = useState('inicio');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [robotStatus, setRobotStatus] = useState('IDLE');
  const [leftSpeed, setLeftSpeed] = useState(255);
  const [rightSpeed, setRightSpeed] = useState(255);
  const [serverUrl, setServerUrl] = useState('http://54.82.198.234:3001');
  
  const [telemetriaData, setTelemetriaData] = useState<Telemetria[]>([]);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [telemetryError, setTelemetryError] = useState('');

  const handleLogin = () => {
    if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      setUsername('');
      setPassword('');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentSection('inicio');
  };

  const loadTelemetryData = async () => {
    setIsLoadingTelemetry(true);
    setTelemetryError('');
    try {
      const response = await fetch('http://54.82.198.234:3001/telemetry');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log('Respuesta de telemetría:', result);
      
      // Manejar tanto formato directo como formato con "data"
      const dataArray = result.data ? result.data : (Array.isArray(result) ? result : []);
      setTelemetriaData(dataArray);
    } catch (error) {
      setTelemetryError(error instanceof Error ? error.message : 'Error al cargar datos');
      console.error('Error cargando telemetría:', error);
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  const latestData = telemetriaData.length > 0 ? telemetriaData[0] : null;

  const sendRobotCommand = async (action: string) => {
    setRobotStatus('Enviando...');
    try {
      const commandData = {
        action: action,
        leftSpeed: leftSpeed,
        rightSpeed: rightSpeed,
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch(`${serverUrl}/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commandData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setRobotStatus(data.state || action.toUpperCase());
      console.log('Comando enviado:', commandData);
    } catch (error) {
      setRobotStatus(`ERROR: ${error instanceof Error ? error.message : 'Conexión fallida'}`);
      console.error('Error enviando comando:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Lock className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Iniciar Sesión</h1>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ingrese su usuario"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ingrese su contraseña"
                />
              </div>
            </div>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-lg"
            >
              Ingresar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Sistema de Gestión</h1>
          <div className="flex items-center gap-2 text-gray-700">
            <User className="w-5 h-5" />
            <span className="font-medium">{ADMIN_USER}</span>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4">
            <button
              onClick={() => setCurrentSection('inicio')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                currentSection === 'inicio' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Inicio</span>
            </button>
            <button
              onClick={() => setCurrentSection('crud')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                currentSection === 'crud' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Database className="w-5 h-5" />
              <span className="font-medium">Gestión de Telemetría</span>
            </button>
            <button
              onClick={() => setCurrentSection('robot')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                currentSection === 'robot' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="font-medium">Control del Robot</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Salir</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {currentSection === 'inicio' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido al Sistema</h2>
              <p className="text-gray-600 mb-6">
                Este es el panel de administración. Desde aquí puedes gestionar todos los recursos del sistema.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Registros</h3>
                  <p className="text-3xl font-bold text-blue-600">{telemetriaData.length}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Sistema</h3>
                  <p className="text-sm text-green-600 font-medium">Operativo</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-purple-900 mb-2">Sesión</h3>
                  <p className="text-sm text-purple-600 font-medium">Activa</p>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'crud' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">Gestión de Telemetría</h2>
                  <button
                    onClick={loadTelemetryData}
                    disabled={isLoadingTelemetry}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {isLoadingTelemetry ? 'Cargando...' : 'Cargar Telemetría'}
                  </button>
                </div>

                {telemetryError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    Error: {telemetryError}
                  </div>
                )}

                {latestData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Última Temperatura</h3>
                      <p className="text-4xl font-bold text-blue-600">{latestData.temperature.toFixed(2)}°C</p>
                      <p className="text-sm text-blue-700 mt-2">
                        {new Date(latestData.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">Última Humedad</h3>
                      <p className="text-4xl font-bold text-green-600">{latestData.humidity.toFixed(2)}%</p>
                      <p className="text-sm text-green-700 mt-2">
                        {new Date(latestData.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {latestData && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Última Ubicación</h3>
                    <div className="bg-gray-100 rounded-lg overflow-hidden" style={{height: '400px'}}>
                      <iframe
                        width="100%"
                        height="100%"
                        style={{border: 0}}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${latestData.longitude-0.01},${latestData.latitude-0.01},${latestData.longitude+0.01},${latestData.latitude+0.01}&layer=mapnik&marker=${latestData.latitude},${latestData.longitude}`}
                        title="Mapa de ubicación"
                      />
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p><strong>Latitud:</strong> {latestData.latitude.toFixed(6)}</p>
                      <p><strong>Longitud:</strong> {latestData.longitude.toFixed(6)}</p>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Historial de Datos</h3>
                  {telemetriaData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay datos cargados. Presiona "Cargar Telemetría" para obtener los datos.
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latitud</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Longitud</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperatura</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Humedad</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counter</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {telemetriaData.slice().reverse().map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {new Date(item.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {item.latitude.toFixed(6)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {item.longitude.toFixed(6)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {item.temperature.toFixed(2)}°C
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {item.humidity.toFixed(2)}%
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {item.counter}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentSection === 'robot' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Control del Robot Tank</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">URL del Servidor</label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="http://54.82.198.234:3001"
                />
                <p className="text-sm text-gray-500 mt-1">Servidor que recibirá los comandos (sin / al final)</p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                <div></div>
                <button
                  onClick={() => sendRobotCommand('forward')}
                  className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
                >
                  ↑ Adelante
                </button>
                <div></div>
                
                <button
                  onClick={() => sendRobotCommand('left')}
                  className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
                >
                  ← Izquierda
                </button>
                <button
                  onClick={() => sendRobotCommand('stop')}
                  className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 transition font-semibold text-lg"
                >
                  ■ Parar
                </button>
                <button
                  onClick={() => sendRobotCommand('right')}
                  className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
                >
                  Derecha →
                </button>
                
                <div></div>
                <button
                  onClick={() => sendRobotCommand('backward')}
                  className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
                >
                  ↓ Atrás
                </button>
                <div></div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Velocidad de Motores</h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Motor Izquierdo</label>
                      <span className="text-lg font-bold text-blue-600">{leftSpeed}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={leftSpeed}
                      onChange={(e) => setLeftSpeed(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Motor Derecho</label>
                      <span className="text-lg font-bold text-blue-600">{rightSpeed}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      value={rightSpeed}
                      onChange={(e) => setRightSpeed(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => sendRobotCommand('speed')}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                  >
                    Aplicar Velocidades
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Estado: </span>
                  <span className="text-lg font-bold text-blue-600">{robotStatus}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;