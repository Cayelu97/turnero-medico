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
  ShieldAlert
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
    currentUser 
  } = useApp();

  const [showLoginModal, setShowLoginModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const turnosHoy = turnos.filter(t => t.fecha === todayStr && t.estado !== 'CANCELADO');
  const enEsperaCount = turnosHoy.filter(t => t.estado === 'EN_ESPERA').length;

  const navItems = [
    { id: 'paciente', label: 'Turnero Online (Afiliados)', icon: Calendar, badge: null },
    { id: 'agenda', label: 'Agenda Secretaría', icon: Calendar, badge: turnosHoy.length > 0 ? turnosHoy.length : null },
    { id: 'recepcion', label: 'Recepción & Espera', icon: UserCheck, badge: enEsperaCount > 0 ? `${enEsperaCount} en espera` : null, badgeColor: 'bg-amber-500' },
    { id: 'doctor', label: 'Portal Médico (Consultorio)', icon: Stethoscope, badge: enEsperaCount > 0 ? `${enEsperaCount}` : null, badgeColor: 'bg-purple-600' },
    { id: 'tv', label: 'Llamador TV', icon: Tv, badge: 'En Vivo', badgeColor: 'bg-rose-500' },
    { id: 'admin', label: 'Configuración & ABM', icon: Settings, badge: null },
    { id: 'hce', label: 'Historia Clínica', icon: FileText, badge: null },
    { id: 'facturacion', label: 'Facturación', icon: DollarSign, badge: null }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
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

                {/* Dropdown selector de clínica activa */}
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

            {/* BARRA DE NAVEGACIÓN PRINCIPAL */}
            <nav className="hidden xl:flex items-center gap-1">
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

            {/* SELECTOR DE PERFIL / LOGIN MODAL TRIGGER */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs transition text-left"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black ${
                  currentUser?.rol === 'SUPERADMIN' ? 'bg-amber-500' :
                  currentUser?.rol === 'PROFESIONAL' ? 'bg-medical-600' :
                  'bg-slate-800'
                }`}>
                  {currentUser?.rol === 'PROFESIONAL' ? 'Dr' : currentUser?.rol === 'SUPERADMIN' ? 'SA' : 'Sec'}
                </div>
                <div className="hidden sm:block">
                  <strong className="block text-[11px] text-slate-800 leading-tight truncate max-w-[110px]">
                    {currentUser?.nombre}
                  </strong>
                  <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">
                    {currentUser?.rol}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN EN PANTALLAS MEDIANAS Y MÓVILES */}
        <div className="xl:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-slate-100 bg-slate-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-medical-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-black bg-white/20 text-white px-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* MODAL DE LOGIN / CAMBIO DE ROL */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};
