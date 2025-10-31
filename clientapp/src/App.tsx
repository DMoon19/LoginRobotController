import React, { useState } from 'react';
import { LogOut, Home, Database, User, Lock, Radio } from 'lucide-react';


const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = '1000874956';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
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
  const [serverUrl, setServerUrl] = useState('http://184.72.132.47:3001');
  const [esp32Ip, setEsp32Ip] = useState("192.168.4.1");

  
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', rol: 'Usuario' },
    { id: 2, nombre: 'María García', email: 'maria@example.com', rol: 'Editor' },
    { id: 3, nombre: 'Carlos López', email: 'carlos@example.com', rol: 'Usuario' }
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario>({ id: 0, nombre: '', email: '', rol: '' });
  const [showForm, setShowForm] = useState(false);

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

  const handleCreate = () => {
    setCurrentUser({ id: 0, nombre: '', email: '', rol: '' });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = (user: Usuario) => {
    setCurrentUser(user);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
    }
  };

  const handleSave = () => {
    if (!currentUser.nombre || !currentUser.email || !currentUser.rol) {
      window.alert('Por favor complete todos los campos');
      return;
    }
    
    if (isEditing) {
      setUsuarios(usuarios.map(u => u.id === currentUser.id ? currentUser : u));
    } else {
      const newId = Math.max(...usuarios.map(u => u.id), 0) + 1;
      setUsuarios([...usuarios, { ...currentUser, id: newId }]);
    }
    setShowForm(false);
    setCurrentUser({ id: 0, nombre: '', email: '', rol: '' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setCurrentUser({ id: 0, nombre: '', email: '', rol: '' });
  };

  const sendRobotCommand = async (action: string) => {
    setRobotStatus('Enviando...');
    try {
      const params = new URLSearchParams({ action });
      if (action === 'speed') {
        params.set('left', leftSpeed.toString());
        params.set('right', rightSpeed.toString());
      }
      
      const response = await fetch(`${serverUrl}/entities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setRobotStatus(data.state || 'OK');
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
              <span className="font-medium">Gestión del CRUD</span>
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
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Usuarios</h3>
                  <p className="text-3xl font-bold text-blue-600">{usuarios.length}</p>
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
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h2>
                {!showForm && (
                  <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Nuevo Usuario
                  </button>
                )}
              </div>

              {showForm ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    {isEditing ? 'Editar Usuario' : 'Crear Usuario'}
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={currentUser.nombre}
                      onChange={(e) => setCurrentUser({...currentUser, nombre: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={currentUser.email}
                      onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                    <select
                      value={currentUser.rol}
                      onChange={(e) => setCurrentUser({...currentUser, rol: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Seleccione un rol</option>
                      <option value="Usuario">Usuario</option>
                      <option value="Editor">Editor</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usuarios.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.rol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {currentSection === 'robot' && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Control del Robot Tank</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">IP del ESP32</label>
                <input
                  type="text"
                  value={esp32Ip}
                  onChange={(e) => setEsp32Ip(e.target.value)}
                  className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="192.168.4.1"
                />
                <p className="text-sm text-gray-500 mt-1">Conéctate a la red WiFi: TankController (Contraseña: tank12345)</p>
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