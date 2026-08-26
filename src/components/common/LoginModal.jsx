import React, { useState } from 'react';
import { User, Shield, Building2, Stethoscope, Lock, KeyRound, Check, X, LogIn, Sparkles, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginModal = ({ isOpen, onClose }) => {
  const { currentUser, switchUser, allClinicas, activeClinica, profesionales, setCurrentView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSelectRole = (userObj, targetView) => {
    switchUser(userObj);
    setCurrentView(targetView);
    onClose();
  };

  const handleCustomLogin = (e) => {
    e.preventDefault();
    const userRole = email.includes('doc') || email.includes('med') ? 'PROFESIONAL' :
                     email.includes('sec') || email.includes('recep') ? 'SECRETARIA' : 'ADMIN_CLINICA';

    const targetView = userRole === 'PROFESIONAL' ? 'doctor' :
                       userRole === 'SECRETARIA' ? 'agenda' : 'admin';

    switchUser({
      id: `usr-${Date.now()}`,
      nombre: email.split('@')[0],
      email,
      rol: userRole,
      clinica_id: activeClinica?.id || allClinicas[0]?.id
    });
    setCurrentView(targetView);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto overflow-hidden animate-scaleIn">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-medical-50 text-medical-700 rounded-2xl border border-medical-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Acceso del Personal por Roles</h3>
              <p className="text-xs text-slate-500">Seleccione su perfil de trabajo o inicie sesión</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfiles de Acceso Rápido (Scrollable) */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
              Ingreso Rápido según tu Rol de Trabajo:
            </span>

            <div className="space-y-2">
              {/* 1. ADMINISTRADOR */}
              <button
                onClick={() => handleSelectRole({
                  id: 'admin-1',
                  nombre: 'Administrador General',
                  email: 'admin@clinica.com',
                  rol: 'ADMIN_CLINICA',
                  clinica_id: activeClinica?.id
                }, 'admin')}
                className="w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 block font-extrabold">👑 Administrador del Centro</strong>
                    <span className="text-[11px] text-slate-500">Acceso a Maestros, ABMs, Obras Sociales, Configuración y Facturación</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-black text-[10px] rounded uppercase">Admin</span>
              </button>

              {/* 2. SECRETARÍA */}
              <button
                onClick={() => handleSelectRole({
                  id: 'sec-1',
                  nombre: 'Secretaría de Recepción',
                  email: 'secretaria@clinica.com',
                  rol: 'SECRETARIA',
                  clinica_id: activeClinica?.id
                }, 'agenda')}
                className="w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    <UserCheck className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <strong className="text-xs text-slate-900 block font-extrabold">👩‍💼 Secretaría / Recepción</strong>
                    <span className="text-[11px] text-slate-500">Agenda diaria de turnos, recepción en sala de espera y agendamiento</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-black text-[10px] rounded uppercase">Secretaría</span>
              </button>

              {/* 3. MÉDICOS DE LA BASE */}
              {profesionales.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => handleSelectRole({
                    id: prof.id,
                    nombre: `Dr(a). ${prof.nombre} ${prof.apellido}`,
                    email: prof.email || 'doctor@clinica.com',
                    rol: 'PROFESIONAL',
                    especialidad: prof.especialidad,
                    profesional_id: prof.id,
                    clinica_id: prof.clinica_id || activeClinica?.id
                  }, 'doctor')}
                  className="w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 bg-medical-50/60 hover:bg-medical-100/70 border-medical-200"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs"
                      style={{ backgroundColor: prof.color_agenda || '#0284c7' }}
                    >
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 block font-extrabold">
                        Dr(a). {prof.nombre} {prof.apellido}
                      </strong>
                      <span className="text-[11px] text-medical-800 font-semibold">
                        {prof.especialidad} • Portal Consultorio Médico y Llamador TV
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-sky-200 text-sky-900 font-black text-[10px] rounded uppercase">Médico</span>
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de Login tradicional */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600 block mb-2">O ingresa con tu correo y clave institucional:</span>
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email de usuario (ej: doctor@clinica.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-medical-500"
              />
              <input
                type="password"
                required
                placeholder="Contraseña de acceso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-medical-500"
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
