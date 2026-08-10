import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Shield, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Tv, 
  Sparkles,
  Info,
  HelpCircle,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginView = ({ onSelectPatientView }) => {
  const { switchUser, activeClinica, authenticateUser, setCurrentView } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(email, password);

      if (result.success) {
        const user = result.user;
        switchUser(user);

        // Redirección inteligente según el rol asignado en la BD
        if (user.rol === 'PROFESIONAL') {
          setCurrentView('doctor');
        } else if (user.rol === 'SECRETARIA') {
          setCurrentView('agenda');
        } else if (user.rol === 'ADMIN_CLINICA' || user.rol === 'SUPERADMIN') {
          setCurrentView('admin');
        } else {
          setCurrentView('agenda');
        }
      } else {
        setErrorMessage(result.message || 'Credenciales de acceso incorrectas. Por favor verifique sus datos.');
      }
      setIsLoading(false);
    }, 400);
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setShowDemoHelp(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-medical-950 text-white flex flex-col justify-between p-4 sm:p-8">
      {/* HEADER SUPERIOR */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-medical-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-medical-500/20 border border-medical-400/30">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                SaludNet <span className="text-sky-400">Pro</span>
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

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acceso Protegido</span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: 2 PORTALES INDEPENDIENTES */}
      <main className="max-w-6xl w-full mx-auto py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* COLUMNA 1: PORTAL DE PACIENTES (PÚBLICO Y DIRECTO) */}
        <div className="lg:col-span-6 bg-gradient-to-b from-medical-900/50 to-slate-900/80 p-6 sm:p-10 rounded-3xl border border-medical-500/30 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-medical-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-black border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal de Turnos Online para Pacientes</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              ¿Deseas solicitar una cita o consultar tus turnos?
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Obtén tu turno médico online en sencillos pasos. Selecciona la especialidad o profesional, elige el día y horario disponible, y recibe la confirmación al instante por WhatsApp y correo.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 pt-2 font-medium">
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">✓</span>
                <span>Acceso 100% libre sin usuario ni contraseñas</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">✓</span>
                <span>Validación de Obra Social, Planes y Coseguros</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">✓</span>
                <span>Voucher digital con recordatorio para Google Calendar</span>
              </li>
            </ul>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={onSelectPatientView}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-slate-950" />
              <span>Ingresar al Turnero de Pacientes</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>
          </div>
        </div>

        {/* COLUMNA 2: LOGIN PROFESIONAL CON CREDENCIALES REALES */}
        <div className="lg:col-span-6 bg-slate-900/90 p-6 sm:p-10 rounded-3xl border border-slate-700/80 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">
                  Acceso Personal Médico & Staff
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ingrese con sus credenciales institucionales autorizadas
                </p>
              </div>
            </div>
          </div>

          {/* BANNER DE ERROR */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-bold animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORMULARIO DE LOGIN */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Correo Electrónico / Usuario
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="ej: doctor@clinica.com o secretaria@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition font-mono placeholder:font-sans placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Contraseña de Acceso
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-medical-600 hover:from-sky-500 hover:to-medical-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-600/30 transition transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Validando credenciales seguras...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Iniciar Sesión en el Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* INSIGNIA DE SEGURIDAD & BOTÓN DISCRETO DE AYUDA DEMO */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Conexión Encriptada SSL 256-bit</span>
            </div>

            <button
              type="button"
              onClick={() => setShowDemoHelp(true)}
              className="text-sky-400 hover:text-sky-300 font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Cuentas demo de prueba</span>
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl w-full mx-auto py-4 text-center text-xs text-slate-500">
        SaludNet Pro • Sistema Integral de Consultorios Médicos & Turnero Online
      </footer>

      {/* MODAL DISCRETO DE CUENTAS DEMO (Solo para testing rápido del usuario) */}
      {showDemoHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                <h4 className="text-sm font-black">Cuentas de Demostración</h4>
              </div>
              <button onClick={() => setShowDemoHelp(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Haz clic en cualquiera de las cuentas de prueba para autocompletar el formulario y probar los diferentes roles:
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@clinica.com', 'admin')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <strong className="text-xs text-amber-300 block">👑 Administrador General</strong>
                  <span className="text-[11px] font-mono text-slate-400">admin@clinica.com / admin</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">Usar</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('secretaria@clinica.com', '123')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <strong className="text-xs text-sky-300 block">👩‍💼 Secretaría / Recepción</strong>
                  <span className="text-[11px] font-mono text-slate-400">secretaria@clinica.com / 123</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded">Usar</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('doctor@clinica.com', '123')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between"
              >
                <div>
                  <strong className="text-xs text-purple-300 block">👨‍⚕️ Profesional Médico (Consultorio)</strong>
                  <span className="text-[11px] font-mono text-slate-400">doctor@clinica.com / 123</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">Usar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
