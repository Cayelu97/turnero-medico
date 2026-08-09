import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Shield, 
  UserCheck, 
  Lock, 
  KeyRound, 
  Building2, 
  ChevronRight, 
  Users, 
  Sparkles,
  ArrowRight,
  Tv
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginView = ({ onSelectPatientView }) => {
  const { switchUser, activeClinica, allClinicas, profesionales, setCurrentView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleRoleLogin = (userObj, targetView) => {
    switchUser(userObj);
    setCurrentView(targetView);
  };

  const handleFormLogin = (e) => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-medical-950 to-slate-900 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* HEADER DE BIENVENIDA */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-medical-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-medical-500/30">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                MediTurnos <span className="text-sky-400">Pro</span>
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded-md border border-sky-500/30">
                SaaS v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {activeClinica?.nombre || 'Centro Médico San Lucas'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('tv')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700"
          title="Abrir monitor de sala de espera"
        >
          <Tv className="w-4 h-4 text-rose-400" />
          <span>Monitor TV Sala</span>
        </button>
      </header>

      {/* CONTENIDO PRINCIPAL: 2 PORTALES DE INGRESO */}
      <main className="max-w-6xl w-full mx-auto py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* COLUMNA 1: PORTAL DEL PACIENTE (SIN LOGIN REQUERIDO) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-medical-800/60 to-medical-900/80 p-6 sm:p-8 rounded-3xl border border-medical-500/40 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-medical-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-black border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acceso Libre para Afiliados y Pacientes</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              ¿Deseas reservar una cita médica?
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Obtén tu turno médico online en 4 sencillos pasos. Selecciona la especialidad o profesional, elige día y horario, y recibe tu confirmación al instante.
            </p>

            <ul className="space-y-2 text-xs text-slate-300 pt-2 font-medium">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                Sin registro previo ni contraseñas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                Validación de Obra Social y cálculo de coseguro
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span>
                Recordatorio automático por WhatsApp y Google Calendar
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              onClick={onSelectPatientView}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-slate-950" />
              <span>Ingresar al Turnero de Pacientes</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
          </div>
        </div>

        {/* COLUMNA 2: ACCESO PERSONAL DE LA CLÍNICA (CON ROLES) */}
        <div className="lg:col-span-7 bg-slate-800/80 p-6 sm:p-8 rounded-3xl border border-slate-700/80 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-sky-400" />
                <span>Acceso Personal Médico & Staff</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccione su perfil de trabajo para ingresar a su panel correspondiente
              </p>
            </div>

            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 underline"
            >
              {showPasswordForm ? 'Ver Perfiles' : 'Ingresar con Clave'}
            </button>
          </div>

          {!showPasswordForm ? (
            /* ACCESO RÁPIDO SEGMENTADO POR ROLES */
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Seleccione su puesto de trabajo:
              </span>

              {/* 1. SECRETARÍA */}
              <button
                onClick={() => handleRoleLogin({
                  id: 'sec-1',
                  nombre: 'Secretaría de Recepción',
                  email: 'secretaria@clinica.com',
                  rol: 'SECRETARIA',
                  clinica_id: activeClinica?.id
                }, 'agenda')}
                className="w-full p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-sky-500/50 rounded-2xl text-left transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-white block group-hover:text-sky-300 transition">
                      👩‍💼 Secretaría / Recepción
                    </strong>
                    <span className="text-xs text-slate-400">
                      Agenda del día, recepción de pacientes en espera y otorgar turnos
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-sky-400 transition" />
              </button>

              {/* 2. MÉDICOS DE LA BASE */}
              {profesionales.map(prof => (
                <button
                  key={prof.id}
                  onClick={() => handleRoleLogin({
                    id: prof.id,
                    nombre: `Dr(a). ${prof.nombre} ${prof.apellido}`,
                    email: prof.email || 'doctor@clinica.com',
                    rol: 'PROFESIONAL',
                    especialidad: prof.especialidad,
                    profesional_id: prof.id,
                    clinica_id: prof.clinica_id || activeClinica?.id
                  }, 'doctor')}
                  className="w-full p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-purple-500/50 rounded-2xl text-left transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                      style={{ backgroundColor: prof.color_agenda || '#0284c7' }}
                    >
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-extrabold text-white block group-hover:text-purple-300 transition">
                        👨‍⚕️ Dr(a). {prof.nombre} {prof.apellido}
                      </strong>
                      <span className="text-xs text-slate-400">
                        {prof.especialidad} • Consultorio, Llamador TV e Historia Clínica
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition" />
                </button>
              ))}

              {/* 3. ADMINISTRADOR */}
              <button
                onClick={() => handleRoleLogin({
                  id: 'admin-1',
                  nombre: 'Administrador General',
                  email: 'admin@clinica.com',
                  rol: 'ADMIN_CLINICA',
                  clinica_id: activeClinica?.id
                }, 'admin')}
                className="w-full p-4 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-2xl text-left transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-sm font-extrabold text-white block group-hover:text-amber-300 transition">
                      👑 Administrador del Centro
                    </strong>
                    <span className="text-xs text-slate-400">
                      ABMs, Obras Sociales, Médicos, Consultorios, Sedes y Facturación
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition" />
              </button>
            </div>
          ) : (
            /* FORMULARIO TRADICIONAL CON EMAIL Y CONTRASEÑA */
            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Correo Electrónico Institucional</label>
                <input
                  type="email"
                  required
                  placeholder="ej: doctor@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Iniciar Sesión
              </button>
            </form>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl w-full mx-auto py-4 text-center text-xs text-slate-500">
        MediTurnos Pro • Sistema de Gestión de Consultorios Médicos & Turnero Online
      </footer>
    </div>
  );
};
