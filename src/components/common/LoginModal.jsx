import React, { useState } from 'react';
import { User, Shield, Building2, Stethoscope, Lock, KeyRound, Check, X, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../services/storage';

export const LoginModal = ({ isOpen, onClose }) => {
  const { currentUser, switchUser, allClinicas } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e) => {
    e.preventDefault();
    // Simulación de login o buscar usuario
    const found = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      switchUser(found);
      onClose();
    } else {
      // Crear sesión genérica
      switchUser({
        id: `usr-${Date.now()}`,
        nombre: email.split('@')[0],
        email,
        rol: 'ADMIN_CLINICA',
        clinica_id: allClinicas[0]?.id
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Iniciar Sesión / Cambiar Perfil</h3>
              <p className="text-xs text-slate-500">Acceso multi-rol con aislamiento estricto por consultorio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfiles de Acceso Rápido */}
        <div className="space-y-4">
          <div>
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
              Perfiles y Consultorios de Demostración:
            </span>

            <div className="space-y-2">
              {INITIAL_USERS.map((usr) => {
                const isCurrent = currentUser?.id === usr.id;
                const clinicaObj = allClinicas.find(c => c.id === usr.clinica_id);

                return (
                  <button
                    key={usr.id}
                    onClick={() => {
                      switchUser(usr);
                      onClose();
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-medical-50 border-medical-500 text-medical-950 font-bold shadow-xs ring-2 ring-medical-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                        usr.rol === 'SUPERADMIN' ? 'bg-amber-500 text-white' :
                        usr.rol === 'PROFESIONAL' ? 'bg-medical-600 text-white' :
                        'bg-slate-800 text-white'
                      }`}>
                        {usr.rol === 'SUPERADMIN' ? <Shield className="w-4 h-4" /> :
                         usr.rol === 'PROFESIONAL' ? <Stethoscope className="w-4 h-4" /> :
                         <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900">{usr.nombre}</strong>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            usr.rol === 'SUPERADMIN' ? 'bg-amber-100 text-amber-900' :
                            usr.rol === 'PROFESIONAL' ? 'bg-sky-100 text-sky-900' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {usr.rol}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {clinicaObj ? `Centro: ${clinicaObj.nombre}` : 'Todas las Clínicas (SaaS Global)'}
                        </span>
                      </div>
                    </div>

                    {isCurrent && <Check className="w-4 h-4 text-medical-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulario de Login tradicional */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-2">O ingresa con usuario y contraseña:</span>
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email de usuario (ej: doctor@clinica.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs"
              />
              <input
                type="password"
                required
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs"
              />

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition"
              >
                Ingresar al Sistema
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
