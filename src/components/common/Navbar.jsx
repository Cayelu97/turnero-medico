import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Tv, 
  Settings, 
  FileText, 
  DollarSign, 
  Stethoscope, 
  Clock, 
  UserCheck, 
  Building2, 
  User, 
  ChevronDown,
  Sparkles,
  ShieldAlert,
  Share2,
  ExternalLink,
  LogOut,
  KeyRound,
  Copy,
  Check,
  Cloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoginModal } from './LoginModal';

export const Navbar = () => {
  const { 
    currentView, 
    setCurrentView, 
    turnos, 
    activeClinica, 
    allClinicas, 
    switchClinica, 
    currentUser,
    logoutUser,
    syncWithCloud,
    pullFromCloudNow,
    showToast 
  } = useApp();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const turnosHoy = turnos.filter(t => t.fecha === todayStr && t.estado !== 'CANCELADO');
  const enEsperaCount = turnosHoy.filter(t => t.estado === 'EN_ESPERA').length;

  // Catálogo maestro de vistas
  const allNavItems = [
    { id: 'paciente', label: 'Turnero Online (Afiliados)', icon: Calendar, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'agenda', label: 'Agenda Secretaría', icon: Calendar, badge: turnosHoy.length > 0 ? turnosHoy.length : null, roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'recepcion', label: 'Recepción & Espera', icon: UserCheck, badge: enEsperaCount > 0 ? `${enEsperaCount}` : null, badgeColor: 'bg-amber-500', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'doctor', label: 'Portal Médico (Consultorio)', icon: Stethoscope, badge: enEsperaCount > 0 ? `${enEsperaCount}` : null, badgeColor: 'bg-purple-600', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'PROFESIONAL'] },
    { id: 'tv', label: 'Llamador TV', icon: Tv, badge: 'En Vivo', badgeColor: 'bg-rose-500', roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'SECRETARIA'] },
    { id: 'admin', label: 'Configuración & ABM', icon: Settings, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN'] },
    { id: 'hce', label: 'Historia Clínica', icon: FileText, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN', 'PROFESIONAL'] },
    { id: 'facturacion', label: 'Facturación', icon: DollarSign, badge: null, roles: ['ADMIN_CLINICA', 'SUPERADMIN'] }
  ];

  // Filtrar según el rol del usuario logueado
  const userRole = currentUser?.rol || 'ADMIN_CLINICA';
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  // Copiar link exclusivo para que saquen turnos los pacientes
  const handleCopyPatientLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=paciente`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast('¡Enlace exclusivo para pacientes copiado! Pégalo en WhatsApp o redes.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Abrir pantalla TV en otra pestaña para el monitor de sala de espera
  const handleOpenTvTab = () => {
    const url = `${window.location.origin}${window.location.pathname}?view=tv`;
    window.open(url, '_blank');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* LOGO & MULTI-TENANT CLINIC SELECTOR */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: activeClinica?.color_primario || '#0284c7' }}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 tracking-tight leading-none">
                    MediTurnos
                  </span>
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-medical-50 text-medical-700 rounded border border-medical-200">
                    Pro
                  </span>
                </div>

                {/* Selector de Centro */}
                <div className="relative inline-block mt-0.5">
                  <select
                    value={activeClinica?.id}
                    onChange={(e) => switchClinica(e.target.value)}
                    className="text-xs font-extrabold text-slate-600 bg-transparent hover:text-slate-900 cursor-pointer pr-4 focus:outline-hidden"
                  >
                    {allClinicas.map(c => (
                      <option key={c.id} value={c.id}>
                        🏥 {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* BARRA DE NAVEGACIÓN PRINCIPAL (SEGMENTADA POR ROL) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative ${
                      isActive
                        ? 'bg-medical-50 text-medical-800 border border-medical-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-medical-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-black text-white px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-medical-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* BOTONES DE ACCESO RÁPIDO & PERFIL */}
            <div className="flex items-center gap-2">
              {/* Botón Sincronizar Nube */}
              <button
                onClick={syncWithCloud}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition shadow-2xs"
                title="Sincronizar datos con Supabase Cloud (guardar en la nube para ver en el celular)"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Sync Nube</span>
              </button>

              {/* Botón Copiar Link Pacientes */}
              <button
                onClick={handleCopyPatientLink}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs"
                title="Copiar enlace limpio exclusivo para que los pacientes saquen turnos"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{copiedLink ? '¡Copiado!' : 'Link Pacientes'}</span>
              </button>

              {/* Botón Abrir TV en Monitor de Sala */}
              <button
                onClick={handleOpenTvTab}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                title="Abrir el llamador en una ventana nueva para el monitor de la sala de espera"
              >
                <Tv className="w-3.5 h-3.5 text-rose-400" />
                <span>Abrir TV</span>
              </button>

              {/* Selector de Perfil / Login */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs transition text-left"
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-black ${
                  currentUser?.rol === 'SUPERADMIN' ? 'bg-amber-500' :
                  currentUser?.rol === 'PROFESIONAL' ? 'bg-medical-600' :
                  'bg-slate-800'
                }`}>
                  {currentUser?.rol === 'PROFESIONAL' ? 'Dr' : currentUser?.rol === 'SUPERADMIN' ? 'SA' : 'Sec'}
                </div>
                <div className="hidden sm:block">
                  <strong className="block text-[11px] text-slate-800 leading-tight truncate max-w-[100px]">
                    {currentUser?.nombre}
                  </strong>
                  <span className="text-[9px] font-extrabold text-slate-500 block uppercase tracking-wider">
                    {currentUser?.rol === 'PROFESIONAL' ? 'Médico' : currentUser?.rol === 'SECRETARIA' ? 'Secretaría' : 'Admin'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Botón Salir / Cerrar Sesión */}
              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-2xs"
                title="Cerrar sesión e ir a la pantalla de bienvenida / login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de Login / Cambio de Rol */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};
