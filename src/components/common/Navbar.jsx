import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Building2, 
  User, 
  ChevronDown,
  Sparkles,
  Share2,
  Tv,
  LogOut,
  KeyRound,
  Check,
  Cloud,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  Search,
  Command,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoginModal } from './LoginModal';
import { QuickSearchPalette } from './QuickSearchPalette';
import { ImportarPacientesModal } from '../admin/ImportarPacientesModal';

export const Navbar = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const { 
    activeClinica, 
    allClinicas, 
    switchClinica, 
    currentUser,
    logoutUser,
    syncWithCloud, 
    showToast 
  } = useApp();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showImportPacientesModal, setShowImportPacientesModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Atajo global Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            
            {/* TOGGLE SIDEBAR + LOGO & CLINIC SELECTOR */}
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleSidebar}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title={isSidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>

              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm"
                style={{ backgroundColor: activeClinica?.color_primario || '#0284c7' }}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 tracking-tight leading-none">
                    SaludNet
                  </span>
                  <span className="text-[10px] font-black text-medical-700 bg-medical-50 px-1.5 py-0.2 rounded border border-medical-200 uppercase">
                    PRO
                  </span>
                </div>

                {/* Multi-Tenant Clinic Switcher */}
                <div className="relative group mt-0.5">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 cursor-pointer hover:text-medical-600 transition">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px]">{activeClinica?.nombre}</span>
                    {allClinicas.length > 1 && <ChevronDown className="w-3 h-3 text-slate-400" />}
                  </div>

                  {allClinicas.length > 1 && (
                    <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50 animate-scaleIn">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Sedes / Centros Médicos
                      </div>
                      {allClinicas.map(c => (
                        <button
                          key={c.id}
                          onClick={() => switchClinica(c.id)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold transition flex items-center justify-between ${
                            c.id === activeClinica.id ? 'bg-medical-50 text-medical-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{c.nombre}</span>
                          {c.id === activeClinica.id && <span className="text-[10px] text-medical-600">Activo</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA & PERFIL */}
            <div className="flex items-center gap-2">
              {/* Botón Búsqueda Rápida / Command Palette */}
              <button
                onClick={() => setShowQuickSearch(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs border border-slate-200 cursor-pointer"
                title="Búsqueda rápida universal (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.2 bg-white text-slate-500 rounded text-[10px] font-mono border border-slate-200 font-bold shadow-2xs">
                  Ctrl K
                </kbd>
              </button>

              {/* Botón Importar Pacientes (Forms / Excel) */}
              <button
                onClick={() => setShowImportPacientesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Importar pacientes masivamente desde Google Forms o Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden lg:inline">Importar Pacientes</span>
                <span className="lg:hidden">Importar</span>
              </button>

              {/* Botón Sincronizar Nube */}
              <button
                onClick={syncWithCloud}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Sincronizar datos con Supabase Cloud (guardar en la nube para ver en el celular)"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden md:inline">Sync Nube</span>
              </button>

              {/* Botón Copiar Link Pacientes */}
              <button
                onClick={handleCopyPatientLink}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Copiar enlace limpio exclusivo para que los pacientes saquen turnos"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{copiedLink ? '¡Copiado!' : 'Link Pacientes'}</span>
              </button>

              {/* Botón Abrir TV en Monitor de Sala */}
              <button
                onClick={handleOpenTvTab}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Abrir el llamador en una ventana nueva para el monitor de la sala de espera"
              >
                <Tv className="w-3.5 h-3.5 text-rose-400" />
                <span>Abrir TV</span>
              </button>

              {/* Selector de Perfil / Login */}
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-xs transition text-left cursor-pointer"
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-black ${
                  currentUser?.rol === 'SUPERADMIN' ? 'bg-amber-500' :
                  currentUser?.rol === 'PROFESIONAL' ? 'bg-medical-600' :
                  'bg-slate-800'
                }`}>
                  {currentUser?.rol === 'PROFESIONAL' ? 'Dr' : currentUser?.rol === 'SUPERADMIN' ? 'SA' : 'Sec'}
                </div>
                <div className="hidden lg:block">
                  <span className="font-extrabold text-slate-800 block text-xs leading-none">
                    {currentUser?.nombre || 'Usuario'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {currentUser?.rol === 'ADMIN_CLINICA' ? 'Admin' :
                     currentUser?.rol === 'SUPERADMIN' ? 'SuperAdmin' :
                     currentUser?.rol === 'PROFESIONAL' ? 'Médico' : 'Secretaría'}
                  </span>
                </div>
              </button>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold transition cursor-pointer"
                title="Cerrar sesión institucional y volver a la pantalla de login"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal Switcher de Roles y Credenciales */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Paleta de Búsqueda Rápida Universal (Ctrl+K) */}
      <QuickSearchPalette
        isOpen={showQuickSearch}
        onClose={() => setShowQuickSearch(false)}
      />

      {/* Modal de Importación Masiva de Pacientes */}
      <ImportarPacientesModal
        isOpen={showImportPacientesModal}
        onClose={() => setShowImportPacientesModal(false)}
      />
    </>
  );
};
